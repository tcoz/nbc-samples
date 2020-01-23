import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, map, take} from 'rxjs/operators';
import {of} from 'rxjs';

export interface ServicePayload {
  data: any;
  status: 'ERROR' | 'OK';
}

@Injectable({
  providedIn: 'root'
})
export class DemoService {

  constructor(private http: HttpClient) {
  }

  /**
   * Note that this example is deliberately way overstated,
   * The intent is to demo that not-so-obvious things can go wrong with a pipe,
   * and that even a catchError can fail you.
   * RxJS is by no means bulletproof. Being thorough about errors is smart.
   * Also, consistent payload types I have always found to be VERY smart.
   */
  getData(url, takes) {
    // There's a reason for this try, keep reading.
    try {
      // this can error (url changed, is incorrect, etc).
      return this.http.get(url)
        .pipe(
          // I like to make sure my services always return the same top level schema.
          // Usually "{ status, data }",
          // This makes it easy for the dev using the service to manage the result,
          // whether it's expected data, success that reports an error, or an outright error.
          // Most shops don't do this, which surprises me as it cleans up a lot of things.
          // Also, check the data. If it's not what we expect, even though the service
          // technically completed successfully, throw an error and adjust.
          // This little pattern has saved me a lot of headaches.
          map(x => {
            if (Array.isArray(x)) {
              return {status: 'OK', data: x} as ServicePayload;
            } else {
              throw {status: 'ERROR', data: 'Payload not an array!'};
            }
          }),
          // a hardcoded value should be fine IF there is no other error.
          // If you want to let this be dynamic, it can error.
          // But again, even if you hardcode, this simple pipe can still fail.
          // Note that the argOutOfRange error will not be caught by
          // catchError, keep reading.
          take(takes),
          // Note I'm not using "caught" here, because I don't want to retry this,
          // which is generally the case when something errors unless you have otherwise
          // built in takeUntils etc. (otherwise you end up with infinite loop).
          // I just want to log the error here, so the vapor trail is clear,
          // and communicate the error on to the dev using the service.
          catchError(err => {
            console.log('There is an error in DemoService.getData pipe! ', err);
            throw ('message' in err ?
              {status: 'ERROR', data: err.message} as ServicePayload : err);
          })
        );
    } catch (e) {
      // the take(-1) error will not be caught in catchError, because in order
      // for catchError to work, the stream has to emit into it, but take will never emit with a bad arg,
      // so the error will propagate upward.
      // This catch will return something the dev using the service can still work with,
      // instead of just crashing. This is actually a VERY good idea for bulletproofing
      // if you have a pipe that can error and stop emitting.
      // Note this will not run for standard pipe errors, only errors that propagate out of it.
      return of ({status: 'ERROR', data: 'There was a bad error, the pipe completely broke'} as ServicePayload);
    }
  }
}
