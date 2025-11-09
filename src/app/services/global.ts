import { Injectable, signal, Signal } from '@angular/core';

interface PostCounts {
  likeCount: number;
  commentCount: number;
}

type PostCountsMap = Map<number, PostCounts>;

@Injectable({
  providedIn: 'root'
})

export class GlobalCountService {
  private _postCounts = signal<PostCountsMap>(new Map());
  readonly postStats: Signal<PostCountsMap> = this._postCounts.asReadonly();

  constructor() { }

  updateLikeCount(postId: number, count: number):void {
    this._postCounts.update(map => {
      const newMap = new Map(map);
      const currentCount = newMap.get(postId) || { likeCount: 0, commentCount: 0};
      currentCount.likeCount = count;
      newMap.set(postId, currentCount);
      return newMap;
    })
  }

  updateCommentCount(postId: number, count: number): void {
    this._postCounts.update(map => {
      const newMap = new Map(map);
      const currentCount = newMap.get(postId) || { likeCount: 0, commentCount: 0 };
      currentCount.commentCount = count;
      newMap.set(postId, currentCount);
      return newMap;
    });
  }



}
