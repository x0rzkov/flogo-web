import {Component, ElementRef, Renderer} from '@angular/core';
import {FlogoLogsContentComponent} from './logs-content.component';


@Component(
  {
    selector: 'flogo-logs-external-window',
    // moduleId: module.id,
    templateUrl: 'logs-external-window.tpl.html',
    styleUrls: ['logs-external-window.component.less']
  }
)
export class FlogoLogsExternalWindowComponent {
  constructor() {
  }
}