export class HttpTrace extends MitmProxy {
    makeWriter(): {
        parts: any[];
        write: (data: any) => void;
        join: () => Buffer;
    };
    saveToFile(filename: any, data: any, subject: any): void;
    serializeRequest(request: any): Promise<void>;
    serializeResponse(response: any): Promise<void>;
    makeRequestParser(id: any, subject: any): any;
    makeResponseParser(id: any, subject: any): any;
    wrapClientForObservableStreaming(client: any, subject: any): Promise<{
        writeFore: (data: any) => void;
        writeBack: (data: any) => void;
        _sniffIt(data: any): void;
        _writeFore(data: any): void;
        _writeBack(data: any): void;
    }>;
    shouldIntercept(): Promise<boolean>;
}
export default HttpTrace;
import MitmProxy from "@pureproxy/mitmproxy";
