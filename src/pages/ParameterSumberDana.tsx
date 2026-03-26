import { sumberDanaData } from "@/data/siskeudes-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ParameterSumberDana() {
  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold font-heading">Parameter Sumber Dana</h1>
        <p className="text-sm text-muted-foreground">Referensi kode sumber dana APBDesa</p>
      </div>
      <div className="p-6">
        <div className="content-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="w-16 font-semibold">No.</TableHead>
                <TableHead className="w-24 font-semibold">Kode</TableHead>
                <TableHead className="font-semibold">Nama Sumber Dana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sumberDanaData.map((item, idx) => (
                <TableRow key={item.kode}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{item.kode}</span>
                  </TableCell>
                  <TableCell className="text-sm">{item.nama}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
