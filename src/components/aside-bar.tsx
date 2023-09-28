import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { VideoInputForm } from "./video-input-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Wand2 } from "lucide-react";
import { PromptSelect } from "./prompt-select";

export function AsideBar(){

  return (
    <>
      <VideoInputForm />
      <Separator />
      <form className="space-y-4">
        <div className="space-y-2">
          <Label>Prompt</Label>
          <PromptSelect />
          <span className="block text-xs text-muted-foreground italic">
            Você poderá customizar essa opção em breve
          </span>
        </div>

        <div className="space-y-2">
          <Label>Modelo</Label>
          <Select disabled defaultValue="gpt3.5">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt3.5">GPT 3.5-turbo 16k</SelectItem>
            </SelectContent>
          </Select>
          <span className="block text-xs text-muted-foreground italic">
            Você poderá customizar essa opção em breve
          </span>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Temperatura</Label>
          <Slider 
            min={0}
            max={1}
            step={0.1}/>
          <span className="block text-xs text-muted-foreground italic">
            Valores mais altos tendem a deixar o resultado mais criativo e com possíveis erros
          </span>
        </div>

        <Separator />

        <Button type="submit" className="w-full">
          Executar
          <Wand2 className="w-4 h-4 ml-2"/>
        </Button>
      </form>
    </>
  )
}