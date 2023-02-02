// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { deferred } from "./deferred.ts";
/** The MuxAsyncIterator class multiplexes multiple async iterators into a
 * single stream. It currently makes an assumption:
 * - The final result (the value returned and not yielded from the iterator)
 *   does not matter; if there is any, it is discarded.
 */ export class MuxAsyncIterator {
    #iteratorCount = 0;
    #yields = [];
    // deno-lint-ignore no-explicit-any
    #throws = [];
    #signal = deferred();
    add(iterable) {
        ++this.#iteratorCount;
        this.#callIteratorNext(iterable[Symbol.asyncIterator]());
    }
    async #callIteratorNext(iterator) {
        try {
            const { value , done  } = await iterator.next();
            if (done) {
                --this.#iteratorCount;
            } else {
                this.#yields.push({
                    iterator,
                    value
                });
            }
        } catch (e) {
            this.#throws.push(e);
        }
        this.#signal.resolve();
    }
    async *iterate() {
        while(this.#iteratorCount > 0){
            // Sleep until any of the wrapped iterators yields.
            await this.#signal;
            // Note that while we're looping over `yields`, new items may be added.
            for(let i = 0; i < this.#yields.length; i++){
                const { iterator , value  } = this.#yields[i];
                yield value;
                this.#callIteratorNext(iterator);
            }
            if (this.#throws.length) {
                for (const e of this.#throws){
                    throw e;
                }
                this.#throws.length = 0;
            }
            // Clear the `yields` list and reset the `signal` promise.
            this.#yields.length = 0;
            this.#signal = deferred();
        }
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1OS4wL2FzeW5jL211eF9hc3luY19pdGVyYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIyIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBEZWZlcnJlZCwgZGVmZXJyZWQgfSBmcm9tIFwiLi9kZWZlcnJlZC50c1wiO1xuXG5pbnRlcmZhY2UgVGFnZ2VkWWllbGRlZFZhbHVlPFQ+IHtcbiAgaXRlcmF0b3I6IEFzeW5jSXRlcmF0b3I8VD47XG4gIHZhbHVlOiBUO1xufVxuXG4vKiogVGhlIE11eEFzeW5jSXRlcmF0b3IgY2xhc3MgbXVsdGlwbGV4ZXMgbXVsdGlwbGUgYXN5bmMgaXRlcmF0b3JzIGludG8gYVxuICogc2luZ2xlIHN0cmVhbS4gSXQgY3VycmVudGx5IG1ha2VzIGFuIGFzc3VtcHRpb246XG4gKiAtIFRoZSBmaW5hbCByZXN1bHQgKHRoZSB2YWx1ZSByZXR1cm5lZCBhbmQgbm90IHlpZWxkZWQgZnJvbSB0aGUgaXRlcmF0b3IpXG4gKiAgIGRvZXMgbm90IG1hdHRlcjsgaWYgdGhlcmUgaXMgYW55LCBpdCBpcyBkaXNjYXJkZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBNdXhBc3luY0l0ZXJhdG9yPFQ+IGltcGxlbWVudHMgQXN5bmNJdGVyYWJsZTxUPiB7XG4gICNpdGVyYXRvckNvdW50ID0gMDtcbiAgI3lpZWxkczogQXJyYXk8VGFnZ2VkWWllbGRlZFZhbHVlPFQ+PiA9IFtdO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAjdGhyb3dzOiBhbnlbXSA9IFtdO1xuICAjc2lnbmFsOiBEZWZlcnJlZDx2b2lkPiA9IGRlZmVycmVkKCk7XG5cbiAgYWRkKGl0ZXJhYmxlOiBBc3luY0l0ZXJhYmxlPFQ+KSB7XG4gICAgKyt0aGlzLiNpdGVyYXRvckNvdW50O1xuICAgIHRoaXMuI2NhbGxJdGVyYXRvck5leHQoaXRlcmFibGVbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkpO1xuICB9XG5cbiAgYXN5bmMgI2NhbGxJdGVyYXRvck5leHQoXG4gICAgaXRlcmF0b3I6IEFzeW5jSXRlcmF0b3I8VD4sXG4gICkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IHZhbHVlLCBkb25lIH0gPSBhd2FpdCBpdGVyYXRvci5uZXh0KCk7XG4gICAgICBpZiAoZG9uZSkge1xuICAgICAgICAtLXRoaXMuI2l0ZXJhdG9yQ291bnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiN5aWVsZHMucHVzaCh7IGl0ZXJhdG9yLCB2YWx1ZSB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLiN0aHJvd3MucHVzaChlKTtcbiAgICB9XG4gICAgdGhpcy4jc2lnbmFsLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFzeW5jICppdGVyYXRlKCk6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxUPiB7XG4gICAgd2hpbGUgKHRoaXMuI2l0ZXJhdG9yQ291bnQgPiAwKSB7XG4gICAgICAvLyBTbGVlcCB1bnRpbCBhbnkgb2YgdGhlIHdyYXBwZWQgaXRlcmF0b3JzIHlpZWxkcy5cbiAgICAgIGF3YWl0IHRoaXMuI3NpZ25hbDtcblxuICAgICAgLy8gTm90ZSB0aGF0IHdoaWxlIHdlJ3JlIGxvb3Bpbmcgb3ZlciBgeWllbGRzYCwgbmV3IGl0ZW1zIG1heSBiZSBhZGRlZC5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy4jeWllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHsgaXRlcmF0b3IsIHZhbHVlIH0gPSB0aGlzLiN5aWVsZHNbaV07XG4gICAgICAgIHlpZWxkIHZhbHVlO1xuICAgICAgICB0aGlzLiNjYWxsSXRlcmF0b3JOZXh0KGl0ZXJhdG9yKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuI3Rocm93cy5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChjb25zdCBlIG9mIHRoaXMuI3Rocm93cykge1xuICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4jdGhyb3dzLmxlbmd0aCA9IDA7XG4gICAgICB9XG4gICAgICAvLyBDbGVhciB0aGUgYHlpZWxkc2AgbGlzdCBhbmQgcmVzZXQgdGhlIGBzaWduYWxgIHByb21pc2UuXG4gICAgICB0aGlzLiN5aWVsZHMubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMuI3NpZ25hbCA9IGRlZmVycmVkKCk7XG4gICAgfVxuICB9XG5cbiAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpOiBBc3luY0l0ZXJhdG9yPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5pdGVyYXRlKCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQW1CLFFBQVEsUUFBUSxlQUFlLENBQUM7QUFPbkQ7Ozs7R0FJRyxDQUNILE9BQU8sTUFBTSxnQkFBZ0I7SUFDM0IsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLENBQUMsTUFBTSxHQUFpQyxFQUFFLENBQUM7SUFDM0MsbUNBQW1DO0lBQ25DLENBQUMsTUFBTSxHQUFVLEVBQUUsQ0FBQztJQUNwQixDQUFDLE1BQU0sR0FBbUIsUUFBUSxFQUFFLENBQUM7SUFFckMsR0FBRyxDQUFDLFFBQTBCLEVBQUU7UUFDOUIsRUFBRSxJQUFJLENBQUMsQ0FBQyxhQUFhLENBQUM7UUFDdEIsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDMUQ7SUFFRCxNQUFNLENBQUMsZ0JBQWdCLENBQ3JCLFFBQTBCLEVBQzFCO1FBQ0EsSUFBSTtZQUNGLE1BQU0sRUFBRSxLQUFLLENBQUEsRUFBRSxJQUFJLENBQUEsRUFBRSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxBQUFDO1lBQzlDLElBQUksSUFBSSxFQUFFO2dCQUNSLEVBQUUsSUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDO2FBQ3ZCLE1BQU07Z0JBQ0wsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFBRSxRQUFRO29CQUFFLEtBQUs7aUJBQUUsQ0FBQyxDQUFDO2FBQ3hDO1NBQ0YsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNWLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdEI7UUFDRCxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDeEI7SUFFRCxPQUFPLE9BQU8sR0FBNkI7UUFDekMsTUFBTyxJQUFJLENBQUMsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFFO1lBQzlCLG1EQUFtRDtZQUNuRCxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUVuQix1RUFBdUU7WUFDdkUsSUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUU7Z0JBQzVDLE1BQU0sRUFBRSxRQUFRLENBQUEsRUFBRSxLQUFLLENBQUEsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQUFBQztnQkFDNUMsTUFBTSxLQUFLLENBQUM7Z0JBQ1osSUFBSSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDbEM7WUFFRCxJQUFJLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7Z0JBQ3ZCLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFFO29CQUM1QixNQUFNLENBQUMsQ0FBQztpQkFDVDtnQkFDRCxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQzthQUN6QjtZQUNELDBEQUEwRDtZQUMxRCxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUN4QixJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsUUFBUSxFQUFFLENBQUM7U0FDM0I7S0FDRjtJQUVELENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFxQjtRQUN6QyxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUN2QjtDQUNGIn0=