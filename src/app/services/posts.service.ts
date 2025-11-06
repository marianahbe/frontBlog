import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostsResponse } from '../models/posts.interface';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = 'https://blogproject-hu3j.onrender.com/posts/';
  private UrlLyC = 'https://blogproject-hu3j.onrender.com/post/';

  constructor(private http: HttpClient) { }

  getPosts(url?: string): Observable<PostsResponse> {
    const fetchUrl = url || this.apiUrl;
    return this.http.get<PostsResponse>(fetchUrl);
  }

  toggleLike(postId: number): Observable<any> {
    return this.http.post<any>(`${this.UrlLyC}${postId}/like/`, {});
  }

}