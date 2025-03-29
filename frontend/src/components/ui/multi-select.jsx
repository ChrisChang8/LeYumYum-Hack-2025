import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

const MultiSelect = ({ options, selected, onChange, placeholder }) => {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectables = options.filter(option => 
    option.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal hover:bg-accent"
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex gap-1 flex-wrap">
              {selected.map((item) => (
                <div
                  key={item}
                  className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm text-sm flex items-center gap-1"
                >
                  {item}
                  <X
                    className="h-4 w-4 cursor-pointer hover:text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange(selected.filter((i) => i !== item))
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command className="w-full">
          <CommandInput 
            placeholder="Search restaurants..." 
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <CommandEmpty>No restaurants found.</CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {selectables.map((option) => (
              <CommandItem
                key={option}
                value={option}
                onSelect={() => {
                  onChange(
                    selected.includes(option)
                      ? selected.filter((item) => item !== option)
                      : [...selected, option]
                  )
                }}
                className="cursor-pointer hover:bg-accent"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={cn(
                    "h-4 w-4 border rounded flex items-center justify-center",
                    selected.includes(option) ? "bg-primary border-primary" : "border-input"
                  )}>
                    {selected.includes(option) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  {option}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { MultiSelect }
