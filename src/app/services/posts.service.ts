import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostsResponse, PostsModel, PostRequestBody } from '../models/posts.interface';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private Url = 'https://blogproject-hu3j.onrender.com/posts/';
  private UrlLyC = 'https://blogproject-hu3j.onrender.com/post/';
  private UrlCreate = 'https://blogproject-hu3j.onrender.com/blog/';

  constructor(private http: HttpClient) { }

  getPosts(url?: string): Observable<PostsResponse> {
    const fetchUrl = url || this.Url;
    return this.http.get<PostsResponse>(fetchUrl);
  }

  getPost(postId: number): Observable<PostsModel> {
    return this.http.get<PostsModel>(`${this.UrlLyC}${postId}/`);
  }

  deletePost(postId: number): Observable<any> {
    return this.http.delete<any>(`${this.UrlLyC}${postId}/delete/`, {});
  }

  updatePost(postId: number, data: PostRequestBody): Observable<PostsModel> {
    return this.http.put<PostsModel>(`${this.UrlCreate}${postId}/`, data);
  }

  createPost(data: PostRequestBody): Observable<PostsModel> {
    return this.http.post<PostsModel>(this.UrlLyC, data);
  }
}