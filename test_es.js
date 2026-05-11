var out = [];
for (var p in PDFSaveOptions.prototype) {
    out.push(p);
}
console.log(out.join(", "));
