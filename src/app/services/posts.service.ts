import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PostsModel } from '../models/posts.interface';

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private apiUrl = 'https://blogproject-hu3j.onrender.com/posts/';

  constructor(private http: HttpClient){ }
  
  getPosts(): Observable<PostsModel[]>{
    return this.http.get<PostsModel[]>(this.apiUrl);
  }
}