import { TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PostsService } from './posts.service';
import { PostsModel, PostsResponse, PostRequestBody, AccessPermission } from '../models/posts.interface';

const mockPost: PostsModel = {
  id: 1,
  author: 'Test User',
  author_team: 'Team A',
  title: 'Test Post',
  content: 'Content of test post',
  excerpt: 'Excerpt',
  timestamp: '2025-01-01T00:00:00Z',
  author_access: 'Read & Write',
  team_access: AccessPermission.READ_AND_WRITE,
  authenticated_access: AccessPermission.READ_ONLY,
  public_access: 'Read Only'
};

const mockPostRequestBody: PostRequestBody = {
  title: 'New Post',
  content: 'Content of new post',
  author_access: 'Read & Write',
  team_access: AccessPermission.READ_ONLY,
  authenticated_access: AccessPermission.NONE,
  public_access: 'None'
};

const mockPostsResponse: PostsResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [mockPost]
};

describe('PostsService', () => {
  let service: PostsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PostsService, 
        provideHttpClient(),
        provideHttpClientTesting(), 
      ]
    });
    service = TestBed.inject(PostsService);
    httpTestingController = TestBed.inject(HttpTestingController);

  });
  afterEach(() => {
    // Verificar que no haya peticiones pendientes
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPosts', () => {
    it('shoul get a list of posts using base URL', () => {
      service.getPosts().subscribe(response => {
        expect(response).toEqual(mockPostsResponse);
        expect(response.results.length).toBe(1);
      });
      const req = httpTestingController.expectOne(service['Url']);
      expect(req.request.method).toEqual('GET');
      req.flush(mockPostsResponse); // respuesta simulada
    });

    it('shoul get a list of posts using paginated URL', () => {
      const paginatedUrl = 'https://blogproject-hu3j.onrender.com/posts/?page=2';
      service.getPosts(paginatedUrl).subscribe(response => {
        expect(response).toEqual(mockPostsResponse);
      });
      const req = httpTestingController.expectOne(paginatedUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(mockPostsResponse);
    });
  });

  describe('getPost', () => {
    it("should get a single post using it's id", () => {
      const postId = 1;
      const expectedUrl = `${service['UrlLyC']}${postId}/`;
      service.getPost(postId).subscribe(post => {
        expect(post).toEqual(mockPost);
        expect(post.id).toBe(postId);
      });
      const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(mockPost);
    });
  });

  describe('deletePost', () => {
    it("should delete post using it's id", () => {
      const postId = 1;
      const expectedUrl = `${service['UrlLyC']}${postId}/delete/`;
      service.deletePost(postId).subscribe(response => {
        expect(response).toEqual({});
      });
      const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toEqual('DELETE');
      req.flush({});
    });
  });

  describe('updatePost', () => {
    it('should update an existing post', () => {
      const postId = 1;
      const updatedPost = { ...mockPost, title: 'Updated Title' };
      const expectedUrl = `${service['UrlCreate']}${postId}/`;
      service.updatePost(postId, mockPostRequestBody).subscribe(post => {
        expect(post).toEqual(updatedPost);
      });
      const req = httpTestingController.expectOne(expectedUrl);
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(mockPostRequestBody);
      req.flush(updatedPost);
    });
  });

  describe('createPost', () => {
    it('should create a new post', () => {
      const newPostId = 2;
      const createdPost = { ...mockPost, id: newPostId, title: mockPostRequestBody.title };
      service.createPost(mockPostRequestBody).subscribe(post => {
        expect(post).toEqual(createdPost);
        expect(post.title).toBe(mockPostRequestBody.title);
      });

      const req = httpTestingController.expectOne(service['UrlLyC']);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(mockPostRequestBody);
      req.flush(createdPost);
    });
  });
});
