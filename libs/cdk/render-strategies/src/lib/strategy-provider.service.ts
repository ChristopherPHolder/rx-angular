import {
  ChangeDetectorRef,
  Inject,
  Injectable,
  NgZone,
  Optional,
} from '@angular/core';
import {
  BehaviorSubject,
  fromEvent,
  MonoTypeOperatorFunction,
  Observable,
} from 'rxjs';
import { map, shareReplay, switchMap, takeUntil } from 'rxjs/operators';
import { mergeDefaultConfig, RX_ANGULAR_CONFIG, RxAngularConfig } from './config';
import { onStrategy } from './onStrategy';
import { RxStrategies, RxStrategyCredentials, RxStrategyNames, ScheduleOnStrategyOptions } from './model';

/**
 *
 *
 * @docsCategory RenderStrategies
 * @docsPage RenderStrategies
 * @publicApi
 */
@Injectable({ providedIn: 'root' })
export class RxStrategyProvider<T extends string = string> {
  private _strategies$ = new BehaviorSubject<RxStrategies<T>>(undefined);
  private _primaryStrategy$ = new BehaviorSubject<
    RxStrategyCredentials<RxStrategyNames<T>>
  >(undefined);

  private _cfg: Required<RxAngularConfig<T>>;
  get config(): Required<RxAngularConfig<T>> {
    return this._cfg;
  }

  get strategies(): RxStrategies<T> {
    return this._strategies$.getValue();
  }

  get strategyNames(): string[] {
    return Object.values(this.strategies).map((s) => s.name);
  }

  get primaryStrategy(): RxStrategyNames<T> {
    return this._primaryStrategy$.getValue().name;
  }

  set primaryStrategy(strategyName: RxStrategyNames<T>) {
    this._primaryStrategy$.next(
      <RxStrategyCredentials<RxStrategyNames<T>>>this.strategies[strategyName]
    );
  }

  readonly primaryStrategy$: Observable<RxStrategyCredentials> = this._primaryStrategy$.asObservable();
  readonly strategies$ = this._strategies$.asObservable();

  readonly strategyNames$ = this.strategies$.pipe(
    map((strategies) => Object.values(strategies).map((s) => s.name)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    @Optional()
    @Inject(RX_ANGULAR_CONFIG)
    cfg: RxAngularConfig<T>
  ) {
    this._cfg = mergeDefaultConfig(cfg);
    this._strategies$.next(this._cfg.customStrategies as any);
    this.primaryStrategy = this.config.primaryStrategy;
  }

  scheduleWith<R>(
    work: (v?: R) => void,
    options?: ScheduleOnStrategyOptions
  ): MonoTypeOperatorFunction<R> {
    const strategy = this.strategies[options?.strategy || this.primaryStrategy];
    const scope = options?.scope || {};
    const _work = getWork(work, options?.patchZone);
    return (o$) =>
      o$.pipe(
        switchMap((v) =>
          onStrategy(
            v,
            strategy,
            (_v) => {
              _work(_v);
            },
            { scope }
          )
        )
      );
  }

  schedule<R>(
    work: () => R,
    options?: ScheduleOnStrategyOptions
  ): Observable<R> {
    const strategy = this.strategies[options?.strategy || this.primaryStrategy];
    const scope = options?.scope || {};
    const _work = getWork(work, options?.patchZone);
    let returnVal: R;
    return onStrategy(
      null,
      strategy,
      () => {
        returnVal = _work();
      },
      { scope }
    ).pipe(map(() => returnVal));
  }

  scheduleCD(
    cdRef: ChangeDetectorRef,
    options?: ScheduleOnStrategyOptions & {
      afterCD?: () => void;
      abortCtrl?: AbortController;
    }
  ): AbortController {
    const strategy = this.strategies[options?.strategy || this.primaryStrategy];
    const scope = options?.scope || cdRef;
    const abC = options?.abortCtrl || new AbortController();
    const work = getWork(() => {
      strategy.work(cdRef, scope);
      if (options?.afterCD) {
        options.afterCD();
      }
    }, options.patchZone);
    onStrategy(
      null,
      strategy,
      () => {
        work();
      },
      { scope }
    )
      .pipe(takeUntil(fromEvent(abC.signal, 'abort')))
      .subscribe();
    return abC;
  }
}

function getWork<T>(
  work: (args?: any) => T,
  patchZone?: false | NgZone
): (args?: any) => T {
  let _work = work;
  if (patchZone) {
    _work = (args?: any) => patchZone.run(() => work(args));
  }
  return _work;
}
