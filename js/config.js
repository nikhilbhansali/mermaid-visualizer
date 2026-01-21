// Configuration constants and theme definitions

export const DEBOUNCE_DELAY = 300;

export const ASPECT_RATIOS = {
    '16:9': { width: 16, height: 9 },
    '9:16': { width: 9, height: 16 },
    '4:3': { width: 4, height: 3 },
    '1:1': { width: 1, height: 1 },
    'auto': null,
    'custom': null
};

export const DIAGRAM_TYPES = {
    FLOWCHART: 'flowchart',
    SEQUENCE: 'sequence',
    GANTT: 'gantt',
    PIE: 'pie',
    CLASS: 'class',
    STATE: 'state',
    ER: 'er',
    MINDMAP: 'mindmap',
    UNKNOWN: 'unknown'
};

// Default theme variables
export const DEFAULT_THEME = {
    // General
    background: '#ffffff',
    primaryTextColor: '#333333',
    lineColor: '#333333',

    // Node colors
    primaryColor: '#ECECFF',
    primaryBorderColor: '#9370DB',
    secondaryColor: '#ffffde',
    secondaryBorderColor: '#aaaa33',
    tertiaryColor: '#fff0f0',
    tertiaryBorderColor: '#ff8888',

    // Text colors
    primaryTextColor: '#333333',
    secondaryTextColor: '#333333',
    tertiaryTextColor: '#333333',

    // Note colors
    noteBkgColor: '#fff5ad',
    noteTextColor: '#333333',
    noteBorderColor: '#aaaa33',

    // Flowchart specific
    nodeBorder: '#9370DB',
    clusterBkg: '#ffffde',
    clusterBorder: '#aaaa33',
    defaultLinkColor: '#333333',

    // Sequence specific
    actorBkg: '#ECECFF',
    actorBorder: '#9370DB',
    actorTextColor: '#333333',
    signalColor: '#333333',
    signalTextColor: '#333333',
    labelBoxBkgColor: '#ECECFF',
    labelBoxBorderColor: '#9370DB',
    labelTextColor: '#333333',
    loopTextColor: '#333333',
    activationBkgColor: '#f4f4f4',
    activationBorderColor: '#666666',
    sequenceNumberColor: 'white',

    // Gantt specific
    sectionBkgColor: '#fff5ad',
    altSectionBkgColor: '#ECECFF',
    sectionBkgColor2: '#fff5ad',
    taskBkgColor: '#8a90dd',
    taskBorderColor: '#534fbc',
    taskTextColor: '#333333',
    taskTextLightColor: 'white',
    taskTextOutsideColor: '#333333',
    activeTaskBkgColor: '#8a90dd',
    activeTaskBorderColor: '#534fbc',
    doneTaskBkgColor: '#d3d3d3',
    doneTaskBorderColor: '#a6a6a6',
    critBkgColor: '#ff8888',
    critBorderColor: '#ff0000',
    todayLineColor: 'red',

    // Pie specific
    pie1: '#ECECFF',
    pie2: '#ffffde',
    pie3: '#fff0f0',
    pie4: '#cde5ff',
    pie5: '#e6ffed',
    pie6: '#ffebe6',
    pie7: '#f5e6ff',
    pie8: '#ffe6f0',
    pie9: '#e6f5ff',
    pie10: '#fff5e6',
    pie11: '#e6ffe6',
    pie12: '#ffe6e6',

    // Class diagram
    classText: '#333333',

    // State diagram
    labelColor: '#333333',

    // ER diagram
    attributeBackgroundColorOdd: '#ffffff',
    attributeBackgroundColorEven: '#f5f5f5'
};

// Preset themes
export const PRESET_THEMES = {
    default: { ...DEFAULT_THEME },

    dark: {
        background: '#1a1a2e',
        primaryTextColor: '#e6e6e6',
        lineColor: '#888888',
        primaryColor: '#4a4a6a',
        primaryBorderColor: '#7070a0',
        secondaryColor: '#3a3a5a',
        secondaryBorderColor: '#6060a0',
        tertiaryColor: '#2a2a4a',
        tertiaryBorderColor: '#5050a0',
        secondaryTextColor: '#e6e6e6',
        tertiaryTextColor: '#e6e6e6',
        noteBkgColor: '#4a4a2a',
        noteTextColor: '#e6e6e6',
        noteBorderColor: '#8a8a4a',
        nodeBorder: '#7070a0',
        clusterBkg: '#2a2a4a',
        clusterBorder: '#5050a0',
        defaultLinkColor: '#888888',
        actorBkg: '#4a4a6a',
        actorBorder: '#7070a0',
        actorTextColor: '#e6e6e6',
        signalColor: '#888888',
        signalTextColor: '#e6e6e6',
        labelBoxBkgColor: '#4a4a6a',
        labelBoxBorderColor: '#7070a0',
        labelTextColor: '#e6e6e6',
        loopTextColor: '#e6e6e6',
        activationBkgColor: '#3a3a5a',
        activationBorderColor: '#888888',
        sequenceNumberColor: '#1a1a2e',
        sectionBkgColor: '#3a3a2a',
        altSectionBkgColor: '#4a4a6a',
        sectionBkgColor2: '#3a3a2a',
        taskBkgColor: '#6060a0',
        taskBorderColor: '#4040a0',
        taskTextColor: '#e6e6e6',
        taskTextLightColor: '#e6e6e6',
        taskTextOutsideColor: '#e6e6e6',
        activeTaskBkgColor: '#7070b0',
        activeTaskBorderColor: '#5050a0',
        doneTaskBkgColor: '#505050',
        doneTaskBorderColor: '#404040',
        critBkgColor: '#a04040',
        critBorderColor: '#c06060',
        todayLineColor: '#ff6060',
        pie1: '#6060a0',
        pie2: '#a06060',
        pie3: '#60a060',
        pie4: '#a0a060',
        pie5: '#60a0a0',
        pie6: '#a060a0',
        pie7: '#808080',
        pie8: '#a08060',
        pie9: '#6080a0',
        pie10: '#80a060',
        pie11: '#a06080',
        pie12: '#6060a0',
        classText: '#e6e6e6',
        labelColor: '#e6e6e6',
        attributeBackgroundColorOdd: '#2a2a4a',
        attributeBackgroundColorEven: '#3a3a5a'
    },

    forest: {
        background: '#f4f9f4',
        primaryTextColor: '#2d5016',
        lineColor: '#3d6926',
        primaryColor: '#cde5cd',
        primaryBorderColor: '#6b8e23',
        secondaryColor: '#e8f5e8',
        secondaryBorderColor: '#8fbc8f',
        tertiaryColor: '#fff8dc',
        tertiaryBorderColor: '#daa520',
        secondaryTextColor: '#2d5016',
        tertiaryTextColor: '#2d5016',
        noteBkgColor: '#fff8dc',
        noteTextColor: '#2d5016',
        noteBorderColor: '#daa520',
        nodeBorder: '#6b8e23',
        clusterBkg: '#e8f5e8',
        clusterBorder: '#8fbc8f',
        defaultLinkColor: '#3d6926',
        actorBkg: '#cde5cd',
        actorBorder: '#6b8e23',
        actorTextColor: '#2d5016',
        signalColor: '#3d6926',
        signalTextColor: '#2d5016',
        labelBoxBkgColor: '#cde5cd',
        labelBoxBorderColor: '#6b8e23',
        labelTextColor: '#2d5016',
        loopTextColor: '#2d5016',
        activationBkgColor: '#e8f5e8',
        activationBorderColor: '#6b8e23',
        sequenceNumberColor: 'white',
        sectionBkgColor: '#fff8dc',
        altSectionBkgColor: '#cde5cd',
        sectionBkgColor2: '#fff8dc',
        taskBkgColor: '#6b8e23',
        taskBorderColor: '#556b2f',
        taskTextColor: 'white',
        taskTextLightColor: 'white',
        taskTextOutsideColor: '#2d5016',
        activeTaskBkgColor: '#8fbc8f',
        activeTaskBorderColor: '#6b8e23',
        doneTaskBkgColor: '#c1d9c1',
        doneTaskBorderColor: '#8fbc8f',
        critBkgColor: '#ff6347',
        critBorderColor: '#dc143c',
        todayLineColor: '#ff4500',
        pie1: '#6b8e23',
        pie2: '#8fbc8f',
        pie3: '#daa520',
        pie4: '#cd853f',
        pie5: '#20b2aa',
        pie6: '#9acd32',
        pie7: '#32cd32',
        pie8: '#228b22',
        pie9: '#3cb371',
        pie10: '#2e8b57',
        pie11: '#66cdaa',
        pie12: '#7cfc00',
        classText: '#2d5016',
        labelColor: '#2d5016',
        attributeBackgroundColorOdd: '#f4f9f4',
        attributeBackgroundColorEven: '#e8f5e8'
    },

    neutral: {
        background: '#ffffff',
        primaryTextColor: '#333333',
        lineColor: '#666666',
        primaryColor: '#f5f5f5',
        primaryBorderColor: '#999999',
        secondaryColor: '#eeeeee',
        secondaryBorderColor: '#888888',
        tertiaryColor: '#e5e5e5',
        tertiaryBorderColor: '#777777',
        secondaryTextColor: '#333333',
        tertiaryTextColor: '#333333',
        noteBkgColor: '#f5f5f5',
        noteTextColor: '#333333',
        noteBorderColor: '#999999',
        nodeBorder: '#999999',
        clusterBkg: '#eeeeee',
        clusterBorder: '#888888',
        defaultLinkColor: '#666666',
        actorBkg: '#f5f5f5',
        actorBorder: '#999999',
        actorTextColor: '#333333',
        signalColor: '#666666',
        signalTextColor: '#333333',
        labelBoxBkgColor: '#f5f5f5',
        labelBoxBorderColor: '#999999',
        labelTextColor: '#333333',
        loopTextColor: '#333333',
        activationBkgColor: '#eeeeee',
        activationBorderColor: '#888888',
        sequenceNumberColor: 'white',
        sectionBkgColor: '#f5f5f5',
        altSectionBkgColor: '#eeeeee',
        sectionBkgColor2: '#f5f5f5',
        taskBkgColor: '#999999',
        taskBorderColor: '#666666',
        taskTextColor: 'white',
        taskTextLightColor: 'white',
        taskTextOutsideColor: '#333333',
        activeTaskBkgColor: '#888888',
        activeTaskBorderColor: '#555555',
        doneTaskBkgColor: '#cccccc',
        doneTaskBorderColor: '#aaaaaa',
        critBkgColor: '#ff9999',
        critBorderColor: '#cc6666',
        todayLineColor: '#cc0000',
        pie1: '#808080',
        pie2: '#999999',
        pie3: '#b3b3b3',
        pie4: '#cccccc',
        pie5: '#666666',
        pie6: '#a0a0a0',
        pie7: '#8a8a8a',
        pie8: '#747474',
        pie9: '#5e5e5e',
        pie10: '#c2c2c2',
        pie11: '#acacac',
        pie12: '#969696',
        classText: '#333333',
        labelColor: '#333333',
        attributeBackgroundColorOdd: '#ffffff',
        attributeBackgroundColorEven: '#f5f5f5'
    }
};

// Mermaid diagram templates
export const TEMPLATES = {
    flowchart: `flowchart TD
    A[Start] --> B{Decision?}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,

    sequence: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hi Alice!
    A->>B: How are you?
    B-->>A: I'm good, thanks!`,

    gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Research         :a1, 2024-01-01, 7d
    Design           :a2, after a1, 5d
    section Development
    Implementation   :a3, after a2, 14d
    Testing          :a4, after a3, 7d
    section Launch
    Deployment       :a5, after a4, 3d`,

    pie: `pie title Project Budget
    "Development" : 45
    "Design" : 25
    "Marketing" : 15
    "Operations" : 15`,

    class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,

    state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Start
    Processing --> Success : Complete
    Processing --> Error : Fail
    Success --> [*]
    Error --> Idle : Retry`,

    er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    CUSTOMER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        date created
        string status
    }`,

    mindmap: `mindmap
    root((Project))
        Planning
            Goals
            Timeline
            Resources
        Development
            Frontend
            Backend
            Testing
        Launch
            Marketing
            Support`
};

// Color mapping for UI labels
export const COLOR_LABELS = {
    background: 'Background',
    primaryTextColor: 'Primary Text',
    lineColor: 'Line Color',
    primaryColor: 'Primary Fill',
    primaryBorderColor: 'Primary Border',
    secondaryColor: 'Secondary Fill',
    tertiaryColor: 'Tertiary Fill'
};

// Diagram-specific colors to show in UI
export const DIAGRAM_SPECIFIC_COLORS = {
    flowchart: {
        clusterBkg: 'Subgraph Fill',
        clusterBorder: 'Subgraph Border'
    },
    sequence: {
        actorBkg: 'Actor Fill',
        actorBorder: 'Actor Border',
        signalColor: 'Signal Color',
        noteBkgColor: 'Note Fill'
    },
    gantt: {
        taskBkgColor: 'Task Fill',
        taskBorderColor: 'Task Border',
        critBkgColor: 'Critical Task',
        todayLineColor: 'Today Line'
    },
    pie: {
        pie1: 'Section 1',
        pie2: 'Section 2',
        pie3: 'Section 3',
        pie4: 'Section 4',
        pie5: 'Section 5',
        pie6: 'Section 6'
    },
    class: {
        classText: 'Class Text'
    },
    state: {
        labelColor: 'Label Color'
    },
    er: {
        attributeBackgroundColorOdd: 'Attr Odd',
        attributeBackgroundColorEven: 'Attr Even'
    },
    mindmap: {}
};

// File format version
export const FILE_VERSION = '1.0';
