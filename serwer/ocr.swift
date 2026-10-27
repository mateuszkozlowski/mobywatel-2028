import Foundation
import Vision
import AppKit
import PDFKit
import ImageIO

// Lokalny odczyt. Nie wykonuje instrukcji znalezionych w dokumencie.
struct Line: Codable { let page: Int; let text: String }
struct Output: Codable { let engine: String; let lines: [Line] }
func recognize(_ image: CGImage, page: Int) throws -> [Line] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    let supported = try request.supportedRecognitionLanguages()
    request.recognitionLanguages = ["pl-PL", "en-US"].filter { supported.contains($0) }
    try VNImageRequestHandler(cgImage: image).perform([request])
    return (request.results ?? []).sorted { a,b in
        abs(a.boundingBox.midY-b.boundingBox.midY) > 0.015 ? a.boundingBox.midY>b.boundingBox.midY : a.boundingBox.minX<b.boundingBox.minX
    }.compactMap { $0.topCandidates(1).first.map { Line(page: page, text: $0.string) } }
}
do {
    guard CommandLine.arguments.count == 2 else { throw NSError(domain:"ocr",code:1) }
    let url = URL(fileURLWithPath: CommandLine.arguments[1])
    var lines: [Line] = []
    var usedOCR = false
    if let pdf = PDFDocument(url:url) {
        if pdf.isLocked { throw NSError(domain:"Zabezpieczony PDF. Wybierz plik bez hasła.",code:2) }
        if pdf.pageCount>10 { throw NSError(domain:"Wybierz umowę do 10 stron.",code:3) }
        for index in 0..<pdf.pageCount {
            guard let page = pdf.page(at:index) else { continue }
            if let text = page.string, text.trimmingCharacters(in:.whitespacesAndNewlines).count>20 {
                lines += text.components(separatedBy:.newlines).filter{ !$0.trimmingCharacters(in:.whitespaces).isEmpty }.map{Line(page:index+1,text:$0)}
            } else {
                let thumbnail=page.thumbnail(of:NSSize(width:1800,height:2400),for:.mediaBox)
                if let cg=thumbnail.cgImage(forProposedRect:nil,context:nil,hints:nil) { lines += try recognize(cg,page:index+1);usedOCR=true }
            }
        }
    } else {
        guard let source=CGImageSourceCreateWithURL(url as CFURL,nil), let props=CGImageSourceCopyPropertiesAtIndex(source,0,nil) as? [CFString:Any], let width=props[kCGImagePropertyPixelWidth] as? NSNumber, let height=props[kCGImagePropertyPixelHeight] as? NSNumber else { throw NSError(domain:"Nie można odczytać obrazu. Wybierz JPG, PNG lub PDF.",code:4) }
        if width.doubleValue*height.doubleValue>20000000 { throw NSError(domain:"Zdjęcie jest zbyt duże. Wybierz obraz do 20 megapikseli.",code:5) }
        guard let image=NSImage(contentsOf:url), let cg=image.cgImage(forProposedRect:nil,context:nil,hints:nil) else { throw NSError(domain:"Nie można odczytać obrazu. Wybierz JPG, PNG lub PDF.",code:4) }
        lines = try recognize(cg,page:1);usedOCR=true
    }
    if lines.count>1000 || lines.reduce(0,{ $0+$1.text.count })>80000 { throw NSError(domain:"Dokument zawiera zbyt dużo tekstu. Wybierz krótszy fragment.",code:6) }
    let output=Output(engine:usedOCR ? "Apple Vision — odczyt lokalny" : "Tekst z PDF — odczyt lokalny",lines:lines)
    let data=try JSONEncoder().encode(output)
    FileHandle.standardOutput.write(data)
} catch {
    let message=(error as NSError).domain
    FileHandle.standardError.write(Data(message.utf8))
    exit(1)
}
