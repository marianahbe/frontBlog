import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CommentsService } from './comments.service';
import { CommentsResponse, CommentsModel } from '../models/posts.interface';

const mockCommentModel: CommentsModel = {
  id: 20,
  user_id: 1,
  post: 15,
  username: 'testuser',
  content: 'Primer comentario',
  timestamp: '2025-11-25T10:00:00Z',
}

const mockCommentModel2: CommentsModel = {
  id: 21,
  user_id: 2,
  post: 15,
  username: 'anotheruser',
  content: 'Segundo comentario',
  timestamp: '2025-11-25T10:00:00Z',
}

const mockCommentsResponse: CommentsResponse = {
  count: 2,
  next: 'next_page_url',
  previous: null,
  results: [
    mockCommentModel, 
    mockCommentModel2, 
  ]
};

describe('CommentsService', () => {
  let service: CommentsService;
  let httpTestingController: HttpTestingController;
  const postId = 15;
  const commentId = 20;
  const baseUrl = 'https://blogproject-hu3j.onrender.com/post/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), 
        provideHttpClientTesting(),
        CommentsService]
    });
    service = TestBed.inject(CommentsService);
    httpTestingController = TestBed.inject(HttpTestingController)
  });

  afterEach(() => {
    httpTestingController.verify();
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCommentsForPost', () => {
    it ('should get list of commnets for a post when no pageUrl is given', () => {
      const expectedUrl = `${baseUrl}${postId}/comments/`;
      service.getCommentsForPost(postId).subscribe(response => {
        expect(response).toEqual(mockCommentsResponse);
        expect(response.results.length).toBe(2);
        expect(response.results[0].content).toBe('Primer comentario');
      });
      const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(mockCommentsResponse);
    });

    it ('shoul use the pagination Url if provided', () => {
      const pageUrl = 'https://blogproject-hu3j.onrender.com/post/15/comments/?page=2';
      service.getCommentsForPost(postId, pageUrl).subscribe(response => {
        expect(response.next).toBe(null);
      });
      const req = httpTestingController.expectOne(pageUrl);
      expect(req.request.method).toEqual('GET');
      const mockPage2R = { ...mockCommentsResponse, next: null, results: [] };
      req.flush(mockPage2R);
    });
  });

  describe('getCommentCountForPost', () => {
    it('should get the count of comments for a post and append page_size=1', () => {
      service.getCommentCountForPost(postId).subscribe(count => {
        expect(count).toBe(mockCommentsResponse.count);
        expect(count).toBe(2);
    });
    const expectedUrl = `${baseUrl}${postId}/comments/?page_size=1`;
    const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockCommentsResponse);
    });
  });

  describe('createComment', () => {
    it ('should create a new comment and send the correct content', () => {
      const newCommentContent = 'amé el post :)';
      const expectedUrl = `${baseUrl}comment/${postId}/`;
      const mockCreatedComment: CommentsModel = { 
        ...mockCommentModel, 
        content: newCommentContent, 
        id: 22 
      };

      service.createComment(postId, newCommentContent).subscribe(comment => {
        expect(comment).toEqual(mockCreatedComment);
        expect(comment.content).toBe(newCommentContent);
      });
      const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({ content: newCommentContent });
      
      req.flush(mockCreatedComment);
    });
  });

  describe('deleteComment', () => {
    it ("should delete a comment knowing it's id", () => {
      const expectedUrl = `${baseUrl}comment/${commentId}/delete/`;
      service.deleteComment(commentId).subscribe(response => {
        // si se elimina devuelve 204 no content, en response no sale nada
        expect(response).toBeNull();
      });
      const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toEqual('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
