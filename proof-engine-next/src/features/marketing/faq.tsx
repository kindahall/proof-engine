"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqs } from "./content"

export function Faq() {
  return (
    <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
      {faqs.map((f, i) => (
        <AccordionItem key={f.q} value={`item-${i}`}>
          <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
