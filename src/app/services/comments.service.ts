import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentsResponse } from '../models/posts.interface';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private UrlLikes = 'https://blogproject-hu3j.onrender.com/post/';
  
  constructor(private http: HttpClient) { }

  getCommentsForPost(postId: number, pageUrl?: string): Observable<CommentsResponse> {
    const url = pageUrl || `${this.UrlLikes}${postId}/comments/`;
    return this.http.get<CommentsResponse>(url);
  }
}
