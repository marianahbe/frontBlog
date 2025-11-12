import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentsService } from '../services/comments.service';
import { CommentsModel, CommentsResponse } from '../models/posts.interface';
import { PaginationService, COMMENTS_PER_PAGE } from '../services/pagination.service'
import { GlobalCountService } from '../services/global';
import { AuthService } from '../services/auth';
import { Observable } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostsModel } from '../models/posts.interface';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinner, RouterLink, MatIconModule],
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

  newCommentContent: string = ''; 
  isLoading: boolean = false;
  isSubmittingComment: boolean = false;
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
    this.isUserAuthenticated$ = this.authService.isLoggedIn;
  }

  loadComments(url?: string): void {
    if (!this.postId) return;
    this.isLoading = true;
    this.currentPage = this.paginationService.getCurrentPageNumber(url || null);
    this.commentsService.getCommentsForPost(this.postId, url).subscribe({
      next: (response: CommentsResponse) => {
        this.comments = response.results.map((comment: CommentsModel) => ({ 
            ...comment
        }));
        this.totalComments = response.count;
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;
        this.isLoading = false;
        this.postStatsService.updateCommentCount(this.postId, response.count);
        console.log('Posts Cargados:', this.comments);
      },
      error: (err) => {
        console.error('Error al cargar los comments:', err);
      }
    });
  }

  submitComment(): void {
    const text = this.newCommentContent.trim();
    if (!text) {
      return;
    }
    this.isSubmittingComment = true;
    this.commentsService.createComment(this.postId, text).subscribe({
      next: () => {
        this.newCommentContent = ''; 
        this.loadComments(); 
        this.isSubmittingComment = false;
      },
      error: (err) => {
        console.error('Error al enviar el comentario:', err);
        this.isSubmittingComment = false;
      }
    });
  }

  cancelCommentCreation(): void {
    this.newCommentContent = ''; 
    this.isSubmittingComment = false;
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

  deleteComment(commentId: number): void {
    if (confirm(`¿Seguro de que quieres eliminar el comentario?`)) {          
        this.commentsService.deleteComment(commentId).subscribe({
            next: () => {
                console.log('Comentario eliminado con éxito.');
                this.loadComments(this.currentPageUrl); 
            },
            error: (err) => {
                console.error('Error al eliminar el comentario:', err);
            }
        });
    }
  }
}
