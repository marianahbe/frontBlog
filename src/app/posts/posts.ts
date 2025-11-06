import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsModel, PostsResponse } from '../models/posts.interface';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { Header } from '../header/header';
import { PaginationService, POSTS_PER_PAGE, LIKES_PER_DETAIL_PAGE, COMMENTS_PER_DETAIL_PAGE } from '../services/pagination.service';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, MatIconModule, Header],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  posts: PostsModel[] = []

  totalPosts: number = 0;
  nextPageUrl: string | null = null;
  previousPageUrl: string | null = null;
  currentPageUrl: string = '';

  pageSize: number = POSTS_PER_PAGE;
  currentPage: number = 1;

  isUserAuthenticated$!: Observable<boolean>;

  constructor(
    private postsService: PostsService,
    private router: Router, 
    private authService: AuthService,
    private paginationService: PaginationService
  ){ }
  
  ngOnInit(): void {
    this.loadPosts();
    this.isUserAuthenticated$ = this.authService.isLoggedIn;
  }

  loadPosts(url?: string): void {
    this.currentPage = this.paginationService.getCurrentPageNumber(url || null);
    this.postsService.getPosts(url).subscribe({
      next: (response: PostsResponse) => {
        this.posts = response.results.map((post: PostsModel) => ({ 
            ...post, /* Copia las propiedades del objeto post para luego sobreescribir si se muestran o no */
            showLikers: false, 
            showCommenters: false 
        }));
        /* Metadatos de la paginación */
        this.totalPosts = response.count;
        this.nextPageUrl = response.next;
        this.previousPageUrl = response.previous;
        console.log('Posts Cargados:', this.posts);
      },
      error: (err) => {
        console.error('Error al cargar los posts:', err);
      }
    });
  }

  readMore(post: PostsModel): void {
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

  showLikers(post: PostsModel): void {
    this.posts.forEach(p => p.showLikers = false);
    post.showLikers = true;
    post.showCommenters = false;
  }

  hideLikers(post: PostsModel): void {
    post.showLikers = false;
  }

  onLike(post: PostsModel): void {
    this.postsService.toggleLike(post.id).subscribe({
      next: (response) => {
        // Actualiza el estado local del post
        if (response.liked) {
          console.log('Likeo');
          // Incrementa el contador
          post.likes_count += 1; 
        } else {
          console.log('Des Likeo');
          // Decrementa el contador
          post.likes_count -= 1;
        }
        
        // Opcional: Recargar los posts o actualizar solo este post para obtener los datos correctos del backend
        // this.loadPosts(); 
      },
      error: (err) => {
        console.error('Error al intentar dar like:', err);
      }
    });
  }

  onComment(post: PostsModel): void {

  }

}
