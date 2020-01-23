import {Component} from '@angular/core';
import {DemoService, ServicePayload} from './demo.service';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  styleUrls: ['./app.component.scss'],
  template: `
    <div>
      <button (click)="onClick('assets/gooddata.json', 1)">Good URL Good Data</button>
    </div>
    <div>
      <button (click)="onClick('assets/badurl.json', 1)">Bad URL</button>
    </div>
    <div>
      <button (click)="onClick('assets/baddata.json', 1)">Good URL, Bad Data</button>
    </div>
    <div>
      <button (click)="onClick('assets/goodata.json', -1)">Good URL, Good Data, bad Arg</button>
    </div>
  `
})
export class AppComponent {

  constructor(private demoService: DemoService) {
  }

  /**
   * Note that this example is deliberately way overstated,
   * The intent is to demo that not-so-obvious things can go wrong with a pipe,
   * and that even a catchError can fail you.
   * RxJS is by no means bulletproof. Being thorough about errors is smart.
   * Also, consistent payload types I have always found to be VERY smart.
   */
  onClick(url, takes) {
    this.demoService.getData(url, takes)
      .pipe(
        // Because this is a consistent payload type, I don't have to bother
        // mocking something for my subscription. Otherwise, I'd have to
        // create an object that my subscription can process cleanly.
        catchError((err: Observable<ServicePayload>) => {
          // Now I have a really clear vapor trail.
          console.log(err);
          // Note that even though the type is correct, the sub is expecting
          // "data" to be an array. But it's not, it's the error sent from the service.
          // My sub will not know what to do with it. So I doctor it up.
          return of({status: 'ERROR', data: []} as ServicePayload);
        })
      )
      .subscribe((x: ServicePayload) => {
        // Note that a service can complete successfully but still have an error.
        // For instance, the backend may have not been able to access a DB, but still
        // successfully sends data (an error object, which is nice if it's the same
        // ServicePayload type used in the UI).
        // This really bulletproofs it.
        x.status === 'ERROR' ?
          (() => {
            console.log('Alert the user nicely somehow!');
            console.log(x.data);
            x.data = Array.isArray(x.data) ? x.data : [];
          })() :
          (() => console.log('All is well, move along'))();
        // No matter what got returned, either a success, a success reporting an error,
        // or an outright error, this will work.
        // If I had not doctored it up, data might just be a string, or null, etc.
        console.log(Array.isArray(x.data), x.data);
      });
  }
}
