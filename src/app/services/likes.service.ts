import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LikesResponse, LikeToggleResponse} from '../models/posts.interface';

@Injectable({
  providedIn: 'root'
})
export class LikesService {
  private UrlLikes = 'https://blogproject-hu3j.onrender.com/post/';
  
  constructor(private http: HttpClient) { }

  getLikesForPost(postId: number, pageUrl?: string): Observable<LikesResponse> {
    const url = pageUrl || `${this.UrlLikes}${postId}/likes/`;
    return this.http.get<LikesResponse>(url);
  }
  
  toggleLike(postId: number): Observable<LikeToggleResponse> {
    const url = `${this.UrlLikes}${postId}/like/`;
    return this.http.post<LikeToggleResponse>(url, {});
  }


}
