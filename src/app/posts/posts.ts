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
      next: (response: PostsResponse) => {
        this.posts = response.results;
        console.log('Posts Cargados:', this.posts);
      },
      error: (err) => {
        console.error('Error al cargar los posts:', err);
      }
    });
  }
}
