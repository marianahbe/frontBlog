import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentsService } from '../services/comments.service';
import { CommentsModel, CommentsResponse } from '../models/posts.interface';
import { PaginationService, COMMENTS_PER_PAGE } from '../services/pagination.service'
import { GlobalCountService } from '../services/global';
import { AuthService } from '../services/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comments.html',
  styleUrl: './comments.scss',
})
export class Comments {
  @Input() postId!: number; // ID del post
  comments: CommentsModel[] = []

  totalComments: number = 0;
  nextPageUrl: string | null = null;
  previousPageUrl: string | null = null;
  currentPageUrl: string = '';

  pageSize: number = COMMENTS_PER_PAGE;
  currentPage: number = 1;

  newCommentText: string = ''; 
  isUserAuthenticated$!: Observable<boolean>;

  private postStatsService = inject(GlobalCountService);
  private authService = inject(AuthService);

  constructor(
    private commentsService: CommentsService,
    private paginationService: PaginationService
  ) { }

  ngOnInit(): void {
    if (this.postId) {
      this.loadComments();
    }
  }

  loadComments(url?: string): void {
    this.currentPage = this.paginationService.getCurrentPageNumber(url || null);
    this.commentsService.getCommentsForPost(this.postId, url).subscribe({
      next: (response: CommentsResponse) => {
        this.comments = response.results.map((comment: CommentsModel) => ({ 
            ...comment
        }));
        this.totalComments = response.count;
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;
        
        this.postStatsService.updateCommentCount(this.postId, response.count);
        console.log('Posts Cargados:', this.comments);
      },
      error: (err) => {
        console.error('Error al cargar los comments:', err);
      }
    });
  }

  submitComment(): void {
    const trimmedText = this.newCommentText.trim();
    if (!trimmedText) {
      return;
    }

    this.commentsService.createComment(this.postId, trimmedText).subscribe({
      next: () => {
        this.newCommentText = ''; 
        this.loadComments(); 
      },
      error: (err) => {
        console.error('Error al enviar el comentario:', err);
      }
    });
  }

  getPaginationRange(): string{
    return this.paginationService.getPaginationRange(
        this.currentPage,
        this.pageSize,
        this.totalComments
    );
  }

  goToNextPage(): void {
    if (this.nextPageUrl){
      this.loadComments(this.nextPageUrl)
    }
  }

  goToPreviousPage(): void {
    if (this.previousPageUrl){
      this.loadComments(this.previousPageUrl)
    }
  }

}
