import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsModel, PostsResponse } from '../models/posts.interface';
import { PostsService } from '../services/posts.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  posts: PostsModel[] = []

  totalPosts: number = 0;
  nextPageUrl: string | null = null;
  previousPageUrl: string | null = null;
  currentPageUrl: string = '';

  pageSize: number = 10;
  currentPage: number = 1;

  constructor(
    private postsService: PostsService,
    private router: Router
  ){ }
  
  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(url?: string): void {
    this.currentPage = this.getCurrentPageNumber(url);

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

  getCurrentPageNumber(url: string | undefined): number{
    if (!url){
      return 1;
    }
    /* Paginador ?page= */
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const page = urlParams.get('page');
    return page ? parseInt(page, 10) : 1;
  }

  getPaginationRange(): string{
    if (this.totalPosts === 0){
      return '';
    }
    const startIndex = (this.currentPage - 1) * this.pageSize + 1;
    const endIndex = Math.min(this.currentPage * this.pageSize, this.totalPosts);
    return `${startIndex}-${endIndex}`;
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

  showCommenters(post: PostsModel): void {
    this.posts.forEach(p => p.showCommenters = false);
    post.showLikers = false;
    post.showCommenters = true;
  }

  hideCommenters(post: PostsModel): void {
    post.showCommenters = false;
  }

}
