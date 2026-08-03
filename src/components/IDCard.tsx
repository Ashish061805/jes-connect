import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getPhotoUrl } from "@/lib/photos";
import { formatDate } from "@/lib/format";
import type { MemberWithRelations } from "@/lib/types";

const ORG_NAME = "Jharkhand Ekata Samaj";

export function IDCard({
  member,
  onPrinted,
}: {
  member: MemberWithRelations;
  onPrinted?: () => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [size, setSize] = useState<"pvc" | "a4">("pvc");
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(member.membership_number ?? member.id, { margin: 0, width: 240 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [member.membership_number, member.id]);

  useEffect(() => {
    let cancelled = false;
    getPhotoUrl(member.photo_url).then((url) => {
      if (!cancelled) setPhoto(url);
    });
    return () => {
      cancelled = true;
    };
  }, [member.photo_url]);

  async function downloadPdf() {
    const node = areaRef.current;
    if (!node) return;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(node, { scale: 3, backgroundColor: "#ffffff" });
      const image = canvas.toDataURL("image/png");
      const pdf =
        size === "a4"
          ? new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
          : new jsPDF({ unit: "mm", format: [110, 90], orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = size === "a4" ? 15 : 5;
      const width = pageWidth - margin * 2;
      const height = (canvas.height / canvas.width) * width;
      pdf.addImage(image, "PNG", margin, margin, width, height);
      pdf.save(`${member.membership_number ?? "jes-card"}.pdf`);
      onPrinted?.();
    } catch (error) {
      console.error(error);
      toast.error("Could not generate the PDF");
    }
  }

  function print() {
    window.print();
    onPrinted?.();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 no-print">
        <Button
          size="sm"
          variant={size === "pvc" ? "default" : "outline"}
          onClick={() => setSize("pvc")}
        >
          PVC card
        </Button>
        <Button size="sm" variant={size === "a4" ? "default" : "outline"} onClick={() => setSize("a4")}>
          A4 sheet
        </Button>
        <Button size="sm" variant="secondary" onClick={downloadPdf}>
          <Download className="mr-1.5 h-4 w-4" /> Download PDF
        </Button>
        <Button size="sm" onClick={print}>
          <Printer className="mr-1.5 h-4 w-4" /> Print
        </Button>
      </div>

      <div ref={areaRef} className="print-area flex flex-wrap gap-4 bg-background p-1">
        {/* Front */}
        <div className="w-[340px] overflow-hidden rounded-xl border border-border bg-white text-[#12261d] shadow">
          <div className="brand-gradient flex items-center gap-2 px-4 py-3 text-primary-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
              JES
            </div>
            <div className="leading-tight">
              <p className="text-[11px] font-semibold uppercase tracking-wide">{ORG_NAME}</p>
              <p className="text-[9px] opacity-80">Membership Identity Card</p>
            </div>
          </div>
          <div className="flex gap-3 p-4">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md border border-[#d6e2da] bg-[#f1f5f2]">
              {photo ? (
                <img src={photo} alt={member.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[9px] text-[#7c8c84]">
                  No photo
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-[11px] leading-relaxed">
              <p className="truncate text-sm font-bold">{member.full_name}</p>
              <p className="font-mono text-[11px] font-semibold text-[#2c6b4f]">
                {member.membership_number}
              </p>
              <p>Region: {member.regions?.name ?? "—"}</p>
              <p>Mobile: {member.mobile}</p>
              <p>Issued: {formatDate(member.membership_start_date)}</p>
              <p>
                Valid till:{" "}
                {member.membership_status === "lifetime"
                  ? "Lifetime"
                  : formatDate(member.membership_expiry_date)}
              </p>
            </div>
            <div className="shrink-0">
              {qr ? <img src={qr} alt="QR code" className="h-16 w-16" /> : null}
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="w-[340px] overflow-hidden rounded-xl border border-border bg-white p-4 text-[10px] leading-relaxed text-[#12261d] shadow">
          <p className="text-[11px] font-bold uppercase tracking-wide">{ORG_NAME}</p>
          <div className="mt-2 space-y-1">
            <p>
              <span className="font-semibold">Address:</span> {member.address ?? "—"}
            </p>
            <p>
              <span className="font-semibold">Blood group:</span> {member.blood_group ?? "—"}
            </p>
            <p>
              <span className="font-semibold">Emergency contact:</span>{" "}
              {member.emergency_contact ?? member.alternate_mobile ?? "—"}
            </p>
          </div>
          <div className="mt-3 border-t border-dashed border-[#c9d8cf] pt-2 text-[9px] text-[#4c5f55]">
            <p>1. This card is the property of {ORG_NAME} and is non-transferable.</p>
            <p>2. Please report loss of this card to your regional office immediately.</p>
            <p>3. Valid only with an active membership; scan the QR to verify.</p>
            <p className="mt-2 font-mono">{member.membership_number}</p>
          </div>
        </div>
      </div>
    </div>
  );
}