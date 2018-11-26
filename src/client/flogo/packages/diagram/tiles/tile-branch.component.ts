import { ChangeDetectorRef, Component, HostBinding, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import {SvgRefFixerService} from '@flogo/core';
import {AbstractTileTaskComponent} from './abstract-tile-task.component';
import { get } from 'lodash';

const ROW_HEIGHT = 78;
const BOTTOM_DISTANCE = 8;
const TILE_HEIGHT = 60;

@Component({
  selector: 'flogo-diagram-tile-branch',
  templateUrl: './tile-branch.component.html',
  styleUrls: ['./tile-branch.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TileBranchComponent extends AbstractTileTaskComponent implements OnChanges {
  @Input() spanRows: number;
  currentSpanRows: number;
  displayBranchOptions = false;

  constructor(svgFixer: SvgRefFixerService, private changeDetector: ChangeDetectorRef) {
    super(svgFixer);
  }

  @HostBinding('class.--configured')
  get hasCondition() {
    return get(this.tile, 'task.status.isBranchConfigured', false);
  }

  ngOnChanges(changes: SimpleChanges) {
    super.ngOnChanges(changes);
    const {spanRows: spanRowsChange} = changes;
    if (!spanRowsChange) {
      return;
    }
    if (spanRowsChange.previousValue < spanRowsChange.currentValue) {
      // allow for parent animation to complete
      setTimeout(() => {
        this.applySpanRowsUpdate();
        this.changeDetector.detectChanges();
      }, 400); // same as transition time
    } else {
      this.applySpanRowsUpdate();
    }
  }

  get containerHeight() {
    return ROW_HEIGHT * this.currentSpanRows;
  }

  get branchHeight() {
    return this.containerHeight + (BOTTOM_DISTANCE / 4);
  }

  get branchPosition() {
    return (TILE_HEIGHT / 2) - this.containerHeight;
  }

  onBranchOptions(event) {
    event.stopPropagation();
    this.displayBranchOptions = !this.displayBranchOptions;
  }

  closeBranchOptions() {
    this.displayBranchOptions = false;
  }

  private applySpanRowsUpdate() {
    this.currentSpanRows = this.spanRows;
  }

}