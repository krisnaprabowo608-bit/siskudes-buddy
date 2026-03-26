import { outputKegiatanData } from "@/data/siskeudes-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ParameterOutputKegiatan() {
  return (
    <div>
      <div className="page-header">
        <h1 className="text-xl font-bold font-heading">Parameter Kode Output Kegiatan</h1>
        <p className="text-sm text-muted-foreground">Referensi output kegiatan dan satuan</p>
      </div>
      <div className="p-6">
        <div className="content-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Kode Kegiatan</TableHead>
                <TableHead className="font-semibold">Kode Output</TableHead>
                <TableHead className="font-semibold">Uraian Output</TableHead>
                <TableHead className="font-semibold">Satuan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outputKegiatanData.map((item) => (
                <TableRow key={item.kodeOutput}>
                  <TableCell>
                    <span className="font-mono text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{item.kodeKegiatan}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{item.kodeOutput}</span>
                  </TableCell>
                  <TableCell className="text-sm">{item.uraianOutput}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.satuanOutput}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
