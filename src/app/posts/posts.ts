import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsModel, PostsResponse } from '../models/posts.interface';
import { PostsService } from '../services/posts.service';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
})
export class Posts {
  posts: PostsModel[] = []

  constructor(private postsService: PostsService){ }
  
  ngOnInit(): void {
    this.postsService.getPosts().subscribe({
      next: (response: any) => {
        this.posts = response.results.map((post: PostsModel) => ({ 
            ...post, /* Copia las propiedades del objeto post para luego sobreescribir si se muestran o no */
            showLikers: false, 
            showCommenters: false 
        }));
        console.log('Posts Cargados:', this.posts);
      },
      error: (err) => {
        console.error('Error al cargar los posts:', err);
      }
    });
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
