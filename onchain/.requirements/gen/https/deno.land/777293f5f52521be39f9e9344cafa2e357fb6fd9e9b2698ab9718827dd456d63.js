/** Creates a Promise with the `reject` and `resolve` functions
 * placed as methods on the promise object itself. It allows you to do:
 *
 * ```ts
 *     import { deferred } from "./deferred.ts";
 *
 *     const p = deferred<number>();
 *     // ...
 *     p.resolve(42);
 * ```
 */ export function deferred() {
    let methods;
    let state = "pending";
    const promise = new Promise((resolve, reject)=>{
        methods = {
            async resolve (value) {
                await value;
                state = "fulfilled";
                resolve(value);
            },
            // deno-lint-ignore no-explicit-any
            reject (reason) {
                state = "rejected";
                reject(reason);
            }
        };
    });
    Object.defineProperty(promise, "state", {
        get: ()=>state
    });
    return Object.assign(promise, methods);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1OS4wL2FzeW5jL2RlZmVycmVkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuXG5cbi8vIFRPRE8ocnkpIEl0J2QgYmUgYmV0dGVyIHRvIG1ha2UgRGVmZXJyZWQgYSBjbGFzcyB0aGF0IGluaGVyaXRzIGZyb21cbi8vIFByb21pc2UsIHJhdGhlciB0aGFuIGFuIGludGVyZmFjZS4gVGhpcyBpcyBwb3NzaWJsZSBpbiBFUzIwMTYsIGhvd2V2ZXJcbi8vIHR5cGVzY3JpcHQgcHJvZHVjZXMgYnJva2VuIGNvZGUgd2hlbiB0YXJnZXRpbmcgRVM1IGNvZGUuXG4vLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC9UeXBlU2NyaXB0L2lzc3Vlcy8xNTIwMlxuLy8gQXQgdGhlIHRpbWUgb2Ygd3JpdGluZywgdGhlIGdpdGh1YiBpc3N1ZSBpcyBjbG9zZWQgYnV0IHRoZSBwcm9ibGVtIHJlbWFpbnMuXG5leHBvcnQgaW50ZXJmYWNlIERlZmVycmVkPFQ+IGV4dGVuZHMgUHJvbWlzZTxUPiB7XG4gIHJlYWRvbmx5IHN0YXRlOiBcInBlbmRpbmdcIiB8IFwiZnVsZmlsbGVkXCIgfCBcInJlamVjdGVkXCI7XG4gIHJlc29sdmUodmFsdWU/OiBUIHwgUHJvbWlzZUxpa2U8VD4pOiB2b2lkO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICByZWplY3QocmVhc29uPzogYW55KTogdm9pZDtcbn1cblxuLyoqIENyZWF0ZXMgYSBQcm9taXNlIHdpdGggdGhlIGByZWplY3RgIGFuZCBgcmVzb2x2ZWAgZnVuY3Rpb25zXG4gKiBwbGFjZWQgYXMgbWV0aG9kcyBvbiB0aGUgcHJvbWlzZSBvYmplY3QgaXRzZWxmLiBJdCBhbGxvd3MgeW91IHRvIGRvOlxuICpcbiAqIGBgYHRzXG4gKiAgICAgaW1wb3J0IHsgZGVmZXJyZWQgfSBmcm9tIFwiLi9kZWZlcnJlZC50c1wiO1xuICpcbiAqICAgICBjb25zdCBwID0gZGVmZXJyZWQ8bnVtYmVyPigpO1xuICogICAgIC8vIC4uLlxuICogICAgIHAucmVzb2x2ZSg0Mik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmVycmVkPFQ+KCk6IERlZmVycmVkPFQ+IHtcbiAgbGV0IG1ldGhvZHM7XG4gIGxldCBzdGF0ZSA9IFwicGVuZGluZ1wiO1xuICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8VD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIG1ldGhvZHMgPSB7XG4gICAgICBhc3luYyByZXNvbHZlKHZhbHVlOiBUIHwgUHJvbWlzZUxpa2U8VD4pIHtcbiAgICAgICAgYXdhaXQgdmFsdWU7XG4gICAgICAgIHN0YXRlID0gXCJmdWxmaWxsZWRcIjtcbiAgICAgICAgcmVzb2x2ZSh2YWx1ZSk7XG4gICAgICB9LFxuICAgICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICAgIHJlamVjdChyZWFzb24/OiBhbnkpIHtcbiAgICAgICAgc3RhdGUgPSBcInJlamVjdGVkXCI7XG4gICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgfSxcbiAgICB9O1xuICB9KTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb21pc2UsIFwic3RhdGVcIiwgeyBnZXQ6ICgpID0+IHN0YXRlIH0pO1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihwcm9taXNlLCBtZXRob2RzKSBhcyBEZWZlcnJlZDxUPjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFlQTs7Ozs7Ozs7OztHQVVHLENBQ0gsT0FBTyxTQUFTLFFBQVEsR0FBbUI7SUFDekMsSUFBSSxPQUFPLEFBQUM7SUFDWixJQUFJLEtBQUssR0FBRyxTQUFTLEFBQUM7SUFDdEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxHQUFLO1FBQ2xELE9BQU8sR0FBRztZQUNSLE1BQU0sT0FBTyxFQUFDLEtBQXlCLEVBQUU7Z0JBQ3ZDLE1BQU0sS0FBSyxDQUFDO2dCQUNaLEtBQUssR0FBRyxXQUFXLENBQUM7Z0JBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNoQjtZQUNELG1DQUFtQztZQUNuQyxNQUFNLEVBQUMsTUFBWSxFQUFFO2dCQUNuQixLQUFLLEdBQUcsVUFBVSxDQUFDO2dCQUNuQixNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDaEI7U0FDRixDQUFDO0tBQ0gsQ0FBQyxBQUFDO0lBQ0gsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFO1FBQUUsR0FBRyxFQUFFLElBQU0sS0FBSztLQUFFLENBQUMsQ0FBQztJQUM5RCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFnQjtDQUN2RCJ9