import MetadataMenu from "main"
import { TFile, Menu, TextComponent } from "obsidian"
import { postValues } from "src/commands/postValues"
import { FieldOptions } from "src/components/NoteFields"
import FieldCommandSuggestModal from "src/options/FieldCommandSuggestModal"
import FieldSettingsModal from "src/settings/FieldSettingsModal"
import { FieldType } from "src/types/fieldTypes"
import Field from "../Field"
import { SettingLocation } from "../FieldManager"
import AbstractCanvasBasedField from "./AbstractCanvasBasedField"

export default class CanvasField extends AbstractCanvasBasedField {

    canvasPathInput: TextComponent;

    constructor(plugin: MetadataMenu, field: Field) {
        super(plugin, field, FieldType.Canvas)
    }

    public displayValue(container: HTMLDivElement, file: TFile, fieldName: string, onClick: () => void): void {
        const dvApi = this.plugin.app.plugins.plugins.dataview?.api
        if (dvApi) {
            const dvValue = dvApi.page(file.path)[fieldName]
            const values = Array.isArray(dvValue) ? dvValue : [dvValue]
            values.forEach((value, i) => {
                if (dvApi.value.isLink(value)) {
                    const link = container.createEl('a', { text: value.path.split("/").last().replace(/(.*).md/, "$1") });
                    link.onclick = () => {
                        this.plugin.app.workspace.openLinkText(value.path, file.path, true)
                        onClick()
                    }
                } else {
                    container.createDiv({ text: value });
                }
                if (i < values.length - 1) {
                    container.createEl('span', { text: " | " })
                }
            })
        }
        container.createDiv()
    }

    addFieldOption(name: string, value: string, file: TFile, location: Menu | FieldCommandSuggestModal | FieldOptions): void {
        //no field option to add for this field, it is automatically updated
    }

    async createAndOpenFieldModal(file: TFile, selectedFieldName: string, value?: string, lineNumber?: number, after?: boolean, asList?: boolean, asComment?: boolean): Promise<void> {
        await postValues(this.plugin, [{ name: this.field.name, payload: { value: "" } }], file, lineNumber, after, asList, asComment)
    }

    createDvField(dv: any, p: any, fieldContainer: HTMLElement, attrs?: { cls?: string | undefined; attr?: Record<string, string> | undefined; options?: Record<string, string> | undefined }): void {
        const fieldValue = dv.el('span', p[this.field.name], attrs);
        fieldContainer.appendChild(fieldValue);
    }

    createSettingContainer(container: HTMLDivElement, plugin: MetadataMenu, location?: SettingLocation): void {

        //options
        //initial values
        const options = this.field.options
        options.direction = (options.direction as "incoming" | "outgoing" | "bothsides") || "bothsides"
        options.nodeColors = (options.nodeColors as string[] | undefined) || []
        options.edgeColors = (options.edgeColors as string[] | undefined) || []
        options.edgeFromSides = (options.edgeFromSides as string[] | undefined) || []
        options.edgeToSides = (options.edgeToSides as string[] | undefined) || []
        options.edgeLabels = (options.edgeLabels as string[] | undefined) || []

        //layout
        const canvasPathContainer = container.createDiv({ cls: "field-container" });
        container.createEl("hr");
        const directionContainer = container.createDiv({ cls: "field-container" });
        const edgeColorsContainer = container.createDiv({ cls: "field-container colors" });
        const edgeFromSidesContainer = container.createDiv({ cls: "field-container edges" })
        container.createDiv({ cls: "sub-text", text: "No edge selected is equivalent to all edges selected" })
        const edgeToSidesContainer = container.createDiv({ cls: "field-container egdes" })
        container.createDiv({ cls: "sub-text", text: "No edge selected is equivalent to all edges selected" })
        const edgeLabelsContainer = container.createDiv({ cls: "field-container labels" });
        const newEdgeLabelContainer = container.createDiv({ cls: "field-container" });
        container.createEl("hr");
        const nodeColorsContainer = container.createDiv({ cls: "field-container colors" });
        const filesFromDVQueryTopContainer = container.createDiv({ cls: "vstacked" })

        //builders
        this.createCanvasPathContainer(canvasPathContainer)
        this.createDirectionContainer(directionContainer, `Direction of the edges pointing to those nodes`)
        this.createDvQueryContainer(filesFromDVQueryTopContainer, "Matching files")
        this.buildColorsContainer(nodeColorsContainer, options.nodeColors, "Node matching colors:");
        this.buildColorsContainer(edgeColorsContainer, options.edgeColors, "Edge matching colors:")
        this.buildEdgeSideContainer(edgeFromSidesContainer, options.edgeFromSides, "Edges matchin From side:")
        this.buildEdgeSideContainer(edgeToSidesContainer, options.edgeToSides, "Edges matchin To side:")
        this.buildLabelsContainer(edgeLabelsContainer, options.edgeLabels, "Edges matching labels: ");
        this.buildNewLabelContainer(edgeLabelsContainer, "Edges matching labels: ", newEdgeLabelContainer, options.edgeLabels, "Add a new matching edge label")
    }

    getOptionsStr(): string {
        return ""
    }

    validateOptions(): boolean {
        let error = false;
        if (!(this.field.options.canvasPath as string)?.endsWith(".canvas")) {
            error = true;
            FieldSettingsModal.setValidationError(
                this.canvasPathInput,
                "This is not a canvas file"
            );
        }
        return !error
    }
}