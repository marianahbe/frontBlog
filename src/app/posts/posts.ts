import { Component, OnInit, inject, HostListener,  ElementRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsModel, PostsResponse, LikesResponse, LikeToggleResponse } from '../models/posts.interface';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { Header } from '../header/header';
import { PaginationService, POSTS_PER_PAGE } from '../services/pagination.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { Likes } from '../likes/likes';
import { Comments } from '../comments/comments'; 
import { GlobalCountService } from '../services/global';
import { LikesService } from '../services/likes.service';

interface CompletePostsModel extends PostsModel {
    showLikers: boolean;
    isLiked: boolean;
    likers: { username: string }[]; 
    comment_count: number;
}

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, MatIconModule, Header, Likes, Comments, MatProgressSpinner],
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

  private postStatsService = inject(GlobalCountService);
  private likeService = inject(LikesService);

  constructor(
    private postsService: PostsService,
    private router: Router, 
    private authService: AuthService,
    private paginationService: PaginationService,
    private elementRef: ElementRef
  ){ }
  
  ngOnInit(): void {
    this.loadPosts();
    this.isUserAuthenticated$ = this.authService.isLoggedIn;

    this.authService.user$.subscribe(user => {
      this.currentUsername = user?.username || null;
      this.posts.forEach(post => this.fetchAndUpdateLikes(post.id, true));
    });
  }

  private fetchAndUpdateLikes(postId: number, skipCountUpdate: boolean = false): void {
    this.likeService.getLikesForPost(postId).subscribe({
      next: (likesResponse: LikesResponse) => {
        if (!skipCountUpdate){
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
            console.error(`Error al obtener/recargar likes para post ${postId}:`, err);
      }
    })
  }

  loadPosts(url?: string): void {
      this.currentPage = this.paginationService.getCurrentPageNumber(url || null);
      this.postsService.getPosts(url).subscribe({
          next: (response: PostsResponse) => {
              this.posts = response.results.map((post: PostsModel) => ({
                  ...post, // Copia las propiedades del objeto post para luego sobreescribir si se muestran o no
                  showLikers: false,
                  isLiked: false,
                  comment_count: 0, // Inicializado a 0 ya que no viene del modelo PostsModel
              })) as CompletePostsModel[];
              /* Metadatos de la paginación */
              this.totalPosts = response.count;
              this.nextPageUrl = response.next;
              this.previousPageUrl = response.previous;

              this.posts.forEach(post => {
                  this.postStatsService.updateCommentCount(post.id, post.comment_count ?? 0);
                  this.fetchAndUpdateLikes(post.id, false)
              });
          },
          error: (err) => {
              console.error('Error al cargar los posts:', err);
          }
      });
  }

  getLikeCount(postId: number): number {
    // Lee el valor actual de la Signal y busca el conteo por ID
    return this.postStatsService.postStats().get(postId)?.likeCount || 0;
  }

  getCommentCount(postId: number): number {
    return this.postStatsService.postStats().get(postId)?.commentCount || 0;
  }

  goToPostDetail(post: PostsModel): void {
    this.router.navigate(['/post', post.id]);
  }

  getPaginationRange(): string{
    return this.paginationService.getPaginationRange(
        this.currentPage,
        this.pageSize,
        this.totalPosts
    );
  }

  goToNextPage(): void {
    if (this.nextPageUrl){
      this.loadPosts(this.nextPageUrl)
    }
  }

  goToPreviousPage(): void {
    if (this.previousPageUrl){
      this.loadPosts(this.previousPageUrl)
    }
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
      console.log('Usuario no autenticado o username desconocido.');
      return;
    }
    const postId = post.id;
    this.likeService.toggleLike(postId).subscribe({
      next: (response: LikeToggleResponse) => {
        this.fetchAndUpdateLikes(postId);
      },
      error: (err) => {
        console.error(`Error al alternar like del post ${postId}:`, err);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  handleClick(event: Event) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);

    const clickedOnLikersButton = (event.target as HTMLElement).closest('.likes-container');
    
    if (!clickedOnLikersButton) {
      this.closeAllLikers();
    }
  }
}