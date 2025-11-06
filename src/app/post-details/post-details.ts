import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../header/header';

@Component({
  selector: 'app-post-details',
  imports: [CommonModule, Header],
  templateUrl: './post-details.html',
  styleUrl: './post-details.scss',
})
export class PostDetails {

}
