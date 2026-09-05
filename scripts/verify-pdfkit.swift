import AppKit
import PDFKit
import Foundation
let root = FileManager.default.currentDirectoryPath + "/"
let document = PDFDocument(url: URL(fileURLWithPath: root + "tmp/qa/rook-final.pdf"))!
for index in 0..<document.pageCount {
    let page = document.page(at: index)!
    let image = page.thumbnail(of: NSSize(width: 1000, height: 1300), for: .mediaBox)
    let data = NSBitmapImageRep(data: image.tiffRepresentation!)!.representation(using: .png, properties: [:])!
    try data.write(to: URL(fileURLWithPath: root + "tmp/qa/pdfkit-\(index+1).png"))
}
let reference = (0..<document.pageCount).flatMap { document.page(at: $0)!.annotations }.first { $0.fieldName == "reference_fast" }!
assert(reference.font?.pointSize == 9)
assert(reference.widgetStringValue == "Your base speed is increased by 15 ft.")
reference.widgetStringValue = "Your base speed is increased by 15 ft. Edited field note."
assert(document.write(to: URL(fileURLWithPath: root + "tmp/qa/pdfkit-edited.pdf")))
let reopened = PDFDocument(url: URL(fileURLWithPath: root + "tmp/qa/pdfkit-edited.pdf"))!
let field = (0..<reopened.pageCount).flatMap { reopened.page(at: $0)!.annotations }.first { $0.fieldName == "reference_fast" }!
assert(field.widgetStringValue!.contains("Edited field note."))
let image = reopened.page(at: reopened.pageCount-1)!.thumbnail(of: NSSize(width: 1000,height:1300),for:.mediaBox)
try NSBitmapImageRep(data:image.tiffRepresentation!)!.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:root+"tmp/qa/pdfkit-after-edit.png"))
print("Apple PDFKit: rendered every page; edited reference text survives save and reopen.")
