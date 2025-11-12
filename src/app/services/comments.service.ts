import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentsResponse, CommentsModel } from '../models/posts.interface';

@Injectable({ 
  providedIn: 'root'
})
export class CommentsService {
  private Url = 'https://blogproject-hu3j.onrender.com/post/';
  
  constructor(private http: HttpClient) { }

  getCommentsForPost(postId: number, pageUrl?: string): Observable<CommentsResponse> {
    const url = pageUrl || `${this.Url}${postId}/comments/`;
    return this.http.get<CommentsResponse>(url);
  }

  createComment(postId: number,content: string): Observable<CommentsModel>{
    const url = `${this.Url}comment/${postId}`;
    return this.http.post<CommentsModel>(url, { content: content })
  }

  deleteComment(postId: number): Observable<any> {
    return this.http.delete<any>(`${this.Url}comment/${postId}/delete/`, {});
  }
}
