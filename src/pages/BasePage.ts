import {Page} from '@playwright/test';
export class Basepage{
  readonly page:Page;
  constructor(Page:Page){
    this.page = Page;
  }


}