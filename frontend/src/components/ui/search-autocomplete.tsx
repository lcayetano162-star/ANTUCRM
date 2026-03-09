import * as React from "react"
import { Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

export interface SearchAutocompleteOption {
    value: string
    label: string
    description?: string
    icon?: React.ReactNode
}

export interface SearchAutocompleteProps {
    options: SearchAutocompleteOption[]
    value?: string
    onChange: (value: string) => void
    onInputChange?: (value: string) => void
    placeholder?: string
    emptyMessage?: string
    className?: string
    triggerClassName?: string
}

export function SearchAutocomplete({
    options,
    value,
    onChange,
    onInputChange,
    placeholder = "Buscar...",
    emptyMessage = "No se encontraron resultados.",
    className,
    triggerClassName,
}: SearchAutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const wrapperRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = React.useMemo(() => {
        return options.find((opt) => opt.value === value)
    }, [options, value])

    // Sync input value with selected option
    React.useEffect(() => {
        if (selectedOption) {
            setInputValue(selectedOption.label)
        } else if (!value) {
            setInputValue("")
        }
    }, [selectedOption, value])

    // Handle outside click to close dropdown
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
        setOpen(true)
        if (onInputChange) {
            onInputChange(e.target.value)
        }
        // If they erase everything, call onChange with empty string
        if (e.target.value === "") {
            onChange("")
        }
    }

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(inputValue.toLowerCase()))
    )

    return (
        <div className={cn("relative w-full", className)} ref={wrapperRef}>
            <div className="relative flex w-full items-center">
                <Search className="absolute left-2.5 h-4 w-4 text-slate-400" />
                <Input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (filteredOptions.length > 0) {
                            setOpen(true)
                        }
                    }}
                    placeholder={placeholder}
                    className={cn(
                        "w-full bg-white pl-9 h-10 ring-1 ring-slate-200 border-0 shadow-sm rounded-xl focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] placeholder:text-slate-400",
                        triggerClassName
                    )}
                />
                {inputValue && (
                    <button
                        type="button"
                        onClick={() => {
                            setInputValue("")
                            onChange("")
                            setOpen(false)
                            if (onInputChange) onInputChange("")
                        }}
                        className="absolute right-2.5 h-4 w-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute top-[calc(100%+4px)] z-50 w-full min-w-[200px] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    <Command>
                        <CommandList className="max-h-[300px]">
                            {filteredOptions.length === 0 ? (
                                <CommandEmpty className="py-6 text-center text-sm">{emptyMessage}</CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {filteredOptions.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label + ' ' + (option.description || '')}
                                            onSelect={() => {
                                                onChange(option.value)
                                                setInputValue(option.label)
                                                setOpen(false)
                                            }}
                                            className="flex items-start gap-2 py-2.5 cursor-pointer"
                                        >
                                            {option.icon && (
                                                <div className="mt-0.5 shrink-0 text-slate-500">
                                                    {option.icon}
                                                </div>
                                            )}
                                            <div className="flex flex-col items-start overflow-hidden">
                                                <span className="truncate w-full text-sm font-medium leading-none mb-1 text-slate-700">{option.label}</span>
                                                {option.description && (
                                                    <span className="truncate w-full text-xs text-slate-500">{option.description}</span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </div>
            )}
        </div>
    )
}
