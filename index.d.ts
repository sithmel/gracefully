export = onTerminate;
/**
 * @param {(args0: string) => Promise<void>} shutdown
 * @param {Options} options
 * @return {void}
 */
declare function onTerminate(shutdown: (args0: string) => Promise<void>, options: Options): void;
declare namespace onTerminate {
    export { Options };
}
type Options = {
    exitDelay?: number | undefined;
    stopWindow?: number | undefined;
    customEvent?: string | undefined;
    handleExceptions?: boolean | undefined;
};
//# sourceMappingURL=index.d.ts.map