interface Props {
  text: string
}

export function InfoTooltip({ text }: Props) {
  return (
    <span
      title={text}
      className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold cursor-help select-none"
    >
      i
    </span>
  )
}
