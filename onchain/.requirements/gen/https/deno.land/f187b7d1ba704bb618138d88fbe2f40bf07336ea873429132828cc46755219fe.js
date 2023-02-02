/**
 * Creates a debounced function that delays the given `func`
 * by a given `wait` time in milliseconds. If the method is called
 * again before the timeout expires, the previous call will be
 * aborted.
 *
 * ```
 * import { debounce } from "./debounce.ts";
 *
 * const log = debounce(
 *   (event: Deno.FsEvent) =>
 *     console.log("[%s] %s", event.kind, event.paths[0]),
 *   200,
 * );
 *
 * for await (const event of Deno.watchFs("./")) {
 *   log(event);
 * }
 * ```
 *
 * @param fn    The function to debounce.
 * @param wait  The time in milliseconds to delay the function.
 */ // deno-lint-ignore no-explicit-any
export function debounce(fn, wait) {
    let timeout = null;
    let flush = null;
    const debounced = (...args)=>{
        debounced.clear();
        flush = ()=>{
            debounced.clear();
            fn.call(debounced, ...args);
        };
        timeout = setTimeout(flush, wait);
    };
    debounced.clear = ()=>{
        if (typeof timeout === "number") {
            clearTimeout(timeout);
            timeout = null;
            flush = null;
        }
    };
    debounced.flush = ()=>{
        flush?.();
    };
    Object.defineProperty(debounced, "pending", {
        get: ()=>typeof timeout === "number"
    });
    return debounced;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1OS4wL2FzeW5jL2RlYm91bmNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8qKlxuICogQSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIGRlbGF5ZWQgYnkgYSBnaXZlbiBgd2FpdGBcbiAqIHRpbWUgaW4gbWlsbGlzZWNvbmRzLiBJZiB0aGUgbWV0aG9kIGlzIGNhbGxlZCBhZ2FpbiBiZWZvcmVcbiAqIHRoZSB0aW1lb3V0IGV4cGlyZXMsIHRoZSBwcmV2aW91cyBjYWxsIHdpbGwgYmUgYWJvcnRlZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWJvdW5jZWRGdW5jdGlvbjxUIGV4dGVuZHMgQXJyYXk8dW5rbm93bj4+IHtcbiAgKC4uLmFyZ3M6IFQpOiB2b2lkO1xuICAvKiogQ2xlYXJzIHRoZSBkZWJvdW5jZSB0aW1lb3V0IGFuZCBvbWl0cyBjYWxsaW5nIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24uICovXG4gIGNsZWFyKCk6IHZvaWQ7XG4gIC8qKiBDbGVhcnMgdGhlIGRlYm91bmNlIHRpbWVvdXQgYW5kIGNhbGxzIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gaW1tZWRpYXRlbHkuICovXG4gIGZsdXNoKCk6IHZvaWQ7XG4gIC8qKiBSZXR1cm5zIGEgYm9vbGVhbiB3ZXRoZXIgYSBkZWJvdW5jZSBjYWxsIGlzIHBlbmRpbmcgb3Igbm90LiAqL1xuICByZWFkb25seSBwZW5kaW5nOiBib29sZWFuO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBkZWJvdW5jZWQgZnVuY3Rpb24gdGhhdCBkZWxheXMgdGhlIGdpdmVuIGBmdW5jYFxuICogYnkgYSBnaXZlbiBgd2FpdGAgdGltZSBpbiBtaWxsaXNlY29uZHMuIElmIHRoZSBtZXRob2QgaXMgY2FsbGVkXG4gKiBhZ2FpbiBiZWZvcmUgdGhlIHRpbWVvdXQgZXhwaXJlcywgdGhlIHByZXZpb3VzIGNhbGwgd2lsbCBiZVxuICogYWJvcnRlZC5cbiAqXG4gKiBgYGBcbiAqIGltcG9ydCB7IGRlYm91bmNlIH0gZnJvbSBcIi4vZGVib3VuY2UudHNcIjtcbiAqXG4gKiBjb25zdCBsb2cgPSBkZWJvdW5jZShcbiAqICAgKGV2ZW50OiBEZW5vLkZzRXZlbnQpID0+XG4gKiAgICAgY29uc29sZS5sb2coXCJbJXNdICVzXCIsIGV2ZW50LmtpbmQsIGV2ZW50LnBhdGhzWzBdKSxcbiAqICAgMjAwLFxuICogKTtcbiAqXG4gKiBmb3IgYXdhaXQgKGNvbnN0IGV2ZW50IG9mIERlbm8ud2F0Y2hGcyhcIi4vXCIpKSB7XG4gKiAgIGxvZyhldmVudCk7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gZm4gICAgVGhlIGZ1bmN0aW9uIHRvIGRlYm91bmNlLlxuICogQHBhcmFtIHdhaXQgIFRoZSB0aW1lIGluIG1pbGxpc2Vjb25kcyB0byBkZWxheSB0aGUgZnVuY3Rpb24uXG4gKi9cbi8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2U8VCBleHRlbmRzIEFycmF5PGFueT4+KFxuICBmbjogKHRoaXM6IERlYm91bmNlZEZ1bmN0aW9uPFQ+LCAuLi5hcmdzOiBUKSA9PiB2b2lkLFxuICB3YWl0OiBudW1iZXIsXG4pOiBEZWJvdW5jZWRGdW5jdGlvbjxUPiB7XG4gIGxldCB0aW1lb3V0OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgbGV0IGZsdXNoOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuICBjb25zdCBkZWJvdW5jZWQ6IERlYm91bmNlZEZ1bmN0aW9uPFQ+ID0gKCguLi5hcmdzOiBUKSA9PiB7XG4gICAgZGVib3VuY2VkLmNsZWFyKCk7XG4gICAgZmx1c2ggPSAoKSA9PiB7XG4gICAgICBkZWJvdW5jZWQuY2xlYXIoKTtcbiAgICAgIGZuLmNhbGwoZGVib3VuY2VkLCAuLi5hcmdzKTtcbiAgICB9O1xuICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGZsdXNoLCB3YWl0KTtcbiAgfSkgYXMgRGVib3VuY2VkRnVuY3Rpb248VD47XG5cbiAgZGVib3VuY2VkLmNsZWFyID0gKCkgPT4ge1xuICAgIGlmICh0eXBlb2YgdGltZW91dCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgICAgdGltZW91dCA9IG51bGw7XG4gICAgICBmbHVzaCA9IG51bGw7XG4gICAgfVxuICB9O1xuXG4gIGRlYm91bmNlZC5mbHVzaCA9ICgpID0+IHtcbiAgICBmbHVzaD8uKCk7XG4gIH07XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGRlYm91bmNlZCwgXCJwZW5kaW5nXCIsIHtcbiAgICBnZXQ6ICgpID0+IHR5cGVvZiB0aW1lb3V0ID09PSBcIm51bWJlclwiLFxuICB9KTtcblxuICByZXR1cm4gZGVib3VuY2VkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWtCQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXNCRyxDQUNILG1DQUFtQztBQUNuQyxPQUFPLFNBQVMsUUFBUSxDQUN0QixFQUFvRCxFQUNwRCxJQUFZLEVBQ1U7SUFDdEIsSUFBSSxPQUFPLEdBQWtCLElBQUksQUFBQztJQUNsQyxJQUFJLEtBQUssR0FBd0IsSUFBSSxBQUFDO0lBRXRDLE1BQU0sU0FBUyxHQUEwQixDQUFDLEdBQUcsSUFBSSxBQUFHLEdBQUs7UUFDdkQsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2xCLEtBQUssR0FBRyxJQUFNO1lBQ1osU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ2xCLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDO1NBQzdCLENBQUM7UUFDRixPQUFPLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNuQyxBQUF5QixBQUFDO0lBRTNCLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBTTtRQUN0QixJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQixZQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEIsT0FBTyxHQUFHLElBQUksQ0FBQztZQUNmLEtBQUssR0FBRyxJQUFJLENBQUM7U0FDZDtLQUNGLENBQUM7SUFFRixTQUFTLENBQUMsS0FBSyxHQUFHLElBQU07UUFDdEIsS0FBSyxJQUFJLENBQUM7S0FDWCxDQUFDO0lBRUYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFO1FBQzFDLEdBQUcsRUFBRSxJQUFNLE9BQU8sT0FBTyxLQUFLLFFBQVE7S0FDdkMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxTQUFTLENBQUM7Q0FDbEIifQ==