import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LikesResponse, LikesModel } from '../models/posts.interface';
import { PaginationService, LIKES_PER_PAGE } from '../services/pagination.service';
import { LikesService } from '../services/likes.service';
import { GlobalCountService } from '../services/global';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-likes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './likes.html',
  styleUrl: './likes.scss',
})
export class Likes {
  @Input() postId!: number; 
  likes: LikesModel[] = []

  totalLikes: number = 0;

  isLoadingLikers: boolean = false;

  nextPageUrl: string | null = null;
  previousPageUrl: string | null = null;
  currentPageUrl: string = '';

  pageSize: number = LIKES_PER_PAGE;
  currentPage: number = 1;

  private postCountService = inject(GlobalCountService);

  constructor(
    private likesService: LikesService,
    private paginationService: PaginationService,
    private snackBar: MatSnackBar
  ){ }

  ngOnInit(): void {
    if (this.postId) {
      this.loadLikes();
    }
  }

  loadLikes(url?: string): void {
    this.isLoadingLikers = true;
    this.currentPage = this.paginationService.getCurrentPageNumber(url || null);
    this.likesService.getLikesForPost(this.postId, url).subscribe({
      next: (response: LikesResponse) => {
        this.likes = response.results.map((like: LikesModel) => ({ 
            ...like
        }));
        this.totalLikes = response.count;
        this.isLoadingLikers = false;
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;
        this.postCountService.updateLikeCount(this.postId, response.count);
      },
      error: (err: any) => {
        this.snackBar.open('Error al cargar los likes', '', {
          duration: 4000,
        });
      this.isLoadingLikers = false;
      }
    });
  }

  getPaginationRange(): string{
    return this.paginationService.getPaginationRange(
        this.currentPage,
        this.pageSize,
        this.totalLikes
    );
  }

  goToNextPage(): void {
    if (this.nextPageUrl){
      this.loadLikes(this.nextPageUrl)
    }
  }

  goToPreviousPage(): void {
    if (this.previousPageUrl){
      this.loadLikes(this.previousPageUrl)
    }
  }


}
