import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CdHelper } from '../../../../shared/utils/cd-helper';

@Component({
  selector: 'rxa-cd-injected',
  template: `
    <rxa-cd-default>
      <div class="row">
        <div class="col-sm-12 col-md-6">
          <rxa-cd-default>
            <rxa-cd-on-push>
            </rxa-cd-on-push>
          </rxa-cd-default>
        </div>
        <div class="col-sm-12 col-md-6">
          <rxa-cd-on-push>
            <rxa-cd-default></rxa-cd-default>
          </rxa-cd-on-push>
        </div>
      </div>
    </rxa-cd-default>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  providers: [CdHelper]
})
export class DetectChangesInjectedComponent {

}
