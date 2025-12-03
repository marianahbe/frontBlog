import { Component, OnInit, inject, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsModel, PostsResponse, LikesResponse, LikeToggleResponse, AccessPermission } from '../models/posts.interface';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { Header } from '../header/header';
import { PaginationService, POSTS_PER_PAGE } from '../services/pagination.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { take, tap } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Likes } from '../likes/likes';
import { Comments } from '../comments/comments';
import { GlobalCountService } from '../services/global';
import { LikesService } from '../services/likes.service';
import { CommentsService } from '../services/comments.service';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ViewChildren, QueryList } from '@angular/core';

interface CompletePostsModel extends PostsModel {
  showLikers: boolean;
  isLiked: boolean;
  likers: { username: string }[];
  comment_count: number;
  isTruncated: boolean;
}

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, MatIconModule, Header, Likes, MatProgressSpinner, MatSnackBarModule],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts implements OnInit {
  posts: CompletePostsModel[] = []

  totalPosts: number = 0;
  nextPageUrl: string | null = null;
  previousPageUrl: string | null = null;
  currentPageUrl: string = '';

  pageSize: number = POSTS_PER_PAGE;
  currentPage: number = 1;

  isUserAuthenticated$!: Observable<boolean>;
  private currentUsername: string | null = null;
  private currentUserId: number | null = null; 
  private currentUserTeam: string | null = null;
  private currentUserRole: 'ADMIN' | 'BLOGGER' | null = null;

  private postStatsService = inject(GlobalCountService);
  private likeService = inject(LikesService);
  private commentsService = inject(CommentsService);
  private sanitizer = inject(DomSanitizer);
  private snackBar = inject(MatSnackBar);

  @ViewChildren(Comments) commentComponents!: QueryList<Comments>;

  constructor(
    private postsService: PostsService,
    private router: Router,
    private authService: AuthService,
    private paginationService: PaginationService,
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
    this.isUserAuthenticated$ = this.authService.isLoggedIn;

    this.authService.user$.pipe(
        tap(user => {
            this.currentUsername = user?.username || null;
            this.currentUserId = user?.id || null;
            this.currentUserTeam = user?.team_name || null;
            this.currentUserRole = user?.role || null;
        }),
        take(1) 
    ).subscribe({
        next: () => {
          this.loadPosts(); 
        },
        error: (err) => {
            this.loadPosts(); 
        }
    });
  }

  private fetchAndUpdateLikes(postId: number, skipCountUpdate: boolean = false): void {
    this.likeService.getLikesForPost(postId).subscribe({
      next: (likesResponse: LikesResponse) => {
        if (!skipCountUpdate) {
          this.postStatsService.updateLikeCount(postId, likesResponse.count);
        }
        const isLikedByCurrentUser: boolean = !!(this.currentUsername && likesResponse.results.some(liker => liker.username === this.currentUsername));

        const postIndex = this.posts.findIndex(p => p.id === postId);

        if (postIndex !== -1) {
          const currentPost = this.posts[postIndex] as CompletePostsModel;
          const updatedPost: CompletePostsModel = {
            ...currentPost,
            isLiked: isLikedByCurrentUser
          };
          this.posts[postIndex] = updatedPost;
        }
      },
      error: (err) => {
        this.snackBar.open('Error al cargar los likes del post', '', {
          duration: 4000,
        });
      }
    })
  }

  loadPosts(url?: string): void {
    this.currentPage = this.paginationService.getCurrentPageNumber(url || null);
    this.postsService.getPosts(url).subscribe({
      next: (response: PostsResponse) => {
        this.posts = response.results.map((post: PostsModel) => ({
          ...post, 
          showLikers: false,
          isLiked: false,
          comment_count: 0, 
          isTruncated: this.checkIfTruncated(post.content, post.excerpt) 
        })) as CompletePostsModel[];
        // Metadatos de la paginación
        this.totalPosts = response.count;
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;

        this.posts.forEach(post => {
          this.fetchAndUpdateLikes(post.id, false)
          this.commentsService.getCommentCountForPost(post.id).subscribe({
            next: (count) => {
              this.postStatsService.updateCommentCount(post.id, count);
            }
          });
        });
      },
      error: (err) => {
        this.snackBar.open('Error al cargar los posts, inténtalo de nuevo', '', {
            duration: 4000,
        });
      }
    });
  }

  getLikeCount(postId: number): number {
    // Lee el valor actual de la Signal y busca el conteo por id
    return this.postStatsService.postStats().get(postId)?.likeCount || 0;
  }

  getCommentCount(postId: number): number {
    return this.postStatsService.postStats().get(postId)?.commentCount || 0;
  }

  goToPostDetail(post: PostsModel): void {
    this.router.navigate(['/posts', post.id]);
  }

  getPaginationRange(): string {
    return this.paginationService.getPaginationRange(
      this.currentPage,
      this.pageSize,
      this.totalPosts
    );
  }

  goToNextPage(): void {
    if (this.nextPageUrl) {
      this.loadPosts(this.nextPageUrl)
    }
  }

  goToPreviousPage(): void {
    if (this.previousPageUrl) {
      this.loadPosts(this.previousPageUrl)
    }
  }

  createPost(): void {
    this.router.navigate(['/posts/create']);
  }

  toggleLikers(post: CompletePostsModel): void {
    const postIndex = this.posts.findIndex(p => p.id === post.id);
    this.closeAllLikers();

    if (postIndex !== -1) {
      this.posts[postIndex] = {
        ...this.posts[postIndex],
        showLikers: !post.showLikers
      } as CompletePostsModel;
    }
  }

  closeAllLikers(): void {
    for (let i = 0; i < this.posts.length; i++) {
      if (this.posts[i].showLikers) {
        this.posts[i] = { ...this.posts[i], showLikers: false } as CompletePostsModel;
        break;
      }
    }
  }

  isLikedByCurrentUser(post: CompletePostsModel): boolean {
    return post.isLiked;
  }

  onLike(post: PostsModel): void {
    if (!this.currentUsername) {
      this.snackBar.open('Debes iniciar sesión para dar Me gusta', '', {
        duration: 4000,
      });
      return;
    }
    const postId = post.id;
    this.likeService.toggleLike(postId).subscribe({
      next: (response: LikeToggleResponse) => {
        this.fetchAndUpdateLikes(postId);
        const message = response.liked ? 'Me gusta añadido' : 'Me gusta eliminado';
        this.snackBar.open(message, '', {
          duration: 4000,
        });
      },
      error: (err) => {
        this.snackBar.open('No se pudo actualizar el estado de Me gusta', '', {
          duration: 4000,
        });
      }
    });
  }

  canEditOrDelete(post: PostsModel): boolean {
    console.log(post.team_access);
    console.log(this.currentUserTeam);
    console.log(post.author_team);
    console.log(this.currentUserRole);

    if (this.currentUsername === null || this.currentUserId === null) {
        return false;
    }
    if (post.author === this.currentUsername) {
        return true;
    }
    if (this.currentUserRole === 'ADMIN') {
        return true; 
    }
    if (post.authenticated_access === AccessPermission.READ_AND_WRITE) {
        return true;
    }
    const isTeamAccessEnabled = post.team_access === AccessPermission.READ_AND_WRITE;
    const isSameTeam = this.currentUserTeam !== null && post.author_team !== undefined && this.currentUserTeam === post.author_team;
    if (isTeamAccessEnabled && isSameTeam) {
        return true;
    }
    return false;
  }

  onDelete(post: PostsModel): void {
      if (!this.canEditOrDelete(post)) {
        this.snackBar.open('Acceso denegado', '', {
          duration: 4000,
        });
        return;
      }
      if (confirm(`¿Seguro de que quieres eliminar la publicación "${post.title}"?`)) {
          this.postsService.deletePost(post.id).subscribe({
              next: () => {
                  this.snackBar.open('Publicación eliminada con éxito', '', {
                    duration: 4000,
                  });
                  this.loadPosts(this.currentPageUrl); 
              },
              error: (err) => {
                  this.snackBar.open('Error al eliminar la publicación, inténtalo de nuevo', '', {
                    duration: 4000,
                  });
              }
          });
      }
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: Event) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    const clickedOnLikersButton = (event.target as HTMLElement).closest('.likes-container');
    if (!clickedOnLikersButton) {
      this.closeAllLikers();
    }
  }
  
  public getSafeHtml(html: string | undefined): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private checkIfTruncated(content: string, excerpt: string): boolean {
    if (!content || !excerpt) return false;
    const contentLength = this.getPlainTextLength(content);
    const excerptLength = this.getPlainTextLength(excerpt);
    return contentLength > excerptLength + 5; 
  }

  private getPlainTextLength(html: string | undefined): number {
    if (!html) return 0;
    
    // elemento temporal para parsear el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
  
    // texto plano
    const plainText = tempDiv.textContent || '';
    
    // se borran los espacios en blanco del inicio y final
    return plainText.trim().length;
  }
  isExcerptTruncated(post: PostsModel): boolean {
    if (!post.content || !post.excerpt) return false;

    const contentLength = this.getPlainTextLength(post.content);
    const excerptLength = this.getPlainTextLength(post.excerpt);
    return contentLength > excerptLength;
  }
}
