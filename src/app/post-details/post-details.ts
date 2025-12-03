import { Component, OnInit, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';
import { PostsModel, LikesResponse } from '../models/posts.interface';
import { Observable, switchMap } from 'rxjs';
import { GlobalCountService } from '../services/global';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Comments } from '../comments/comments'
import { ActivatedRoute } from '@angular/router';
import { LikesService } from '../services/likes.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-post-details',
  imports: [CommonModule, Header, Comments, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './post-details.html',
  styleUrl: './post-details.scss',
})
export class PostDetails implements OnInit{

  post: PostsModel | null = null;
  postId: number | null = null;

  isLoading: boolean = true;

  isUserAuthenticated$!: Observable<boolean>;
  private currentUsername: string | null = null;
  private currentUserId: number | null = null; 
  private currentUserTeam: string | null = null;
  private currentUserRole: 'ADMIN' | 'BLOGGER' | null = null;

  private route = inject(ActivatedRoute);
  private postStatsService = inject(GlobalCountService);
  private likesService = inject(LikesService); 
  private sanitizer = inject(DomSanitizer);
  private snackBar = inject(MatSnackBar);
  
  constructor(
    private postsService: PostsService,
    private authService: AuthService,
    private router: Router
  ) { }
  
  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        this.postId = id ? +id : null;
        if (this.postId) {
          this.isLoading = true;
          return this.postsService.getPost(this.postId);
        }
        return new Observable<PostsModel>();
      })
    ).subscribe({
      next: (post:PostsModel) => {
        this.post = post;
        this.isLoading = false;
        this.fetchAndUpdateLikesCount(post.id);
      },
      error: (err) => {
        this.snackBar.open('Error al cargar el detalle del post', '', {
          duration: 4000,
        });
        this.post = null;
        this.isLoading = false;
      }
    });
      this.isUserAuthenticated$ = this.authService.isLoggedIn;
      this.authService.user$.subscribe(user => {
      this.currentUsername = user?.username || null;
      this.currentUserId = user?.id || null;
      this.currentUserTeam = user?.team_name || null;
    });

  }

  private fetchAndUpdateLikesCount(postId: number): void {
    this.likesService.getLikesForPost(postId).subscribe({
      next: (likesResponse: LikesResponse) => {
        this.postStatsService.updateLikeCount(postId, likesResponse.count);
      },
      error: (err) => {
        this.snackBar.open('Error al obtener los likes del post', '', {
          duration: 4000,
        });
      }
    });
  }

  getLikeCount(): number {
    if (!this.postId) return 0;
    return this.postStatsService.postStats().get(this.postId)?.likeCount || 0;
  }

  getCommentCount(): number {
    if (!this.postId) return 0;
    return this.postStatsService.postStats().get(this.postId)?.commentCount || 0;
  }

  goToPosts(): void {
    this.router.navigate(['/posts']);
  }

  goToEditPost(): void {
    if (this.postId) {
      this.router.navigate(['/posts', this.postId, 'edit']);
    }
  }

  get canEdit(): boolean {
    console.log(this.currentUserTeam);
    if (this.post === null || this.currentUsername === null || this.currentUserId === null) {
        return false;
    }
    const post = this.post;
    if (this.currentUsername === null || this.currentUserId === null) {
        return false;
    }
    if (post.author === this.currentUsername) {
        return true;
    }
    if (this.currentUserRole === 'ADMIN') {
        return true; 
    }
    if (post.authenticated_access === 'Read & Write') {
        return true;
    }
    const isTeamAccessEnabled = post.team_access === 'Read & Write';
    const isSameTeam = this.currentUserTeam !== null && post.author_team !== undefined && this.currentUserTeam === post.author_team;
    if (isTeamAccessEnabled && isSameTeam) {
        return true;
    }
    return false;
  }

  public getSafeHtml(html: string | undefined): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
