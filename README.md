# DependencyTreeJS

A JavaScript plugin to draw dependency trees representing morpho-syntactic analysis.

DependencyTreeJS is part of [KotlinNLP](http://kotlinnlp.com/ "KotlinNLP").


## Requirements

* jQuery


How to use
----------

Include DependencyTreeJS in the `head` section of your HTML page. 

HTML:

```html
<div id="dependency-tree"></div>
```

JS:

```javascript
var data = [ /* Parsed sentences data */ ],
    DT = $("#dependency-tree").dependencyTree();

DT.draw(data);
```


Data format
-----------

Data are represented as a list of sentences.

Each sentence is an object with the properties `id`, `atoms`, `entities` and `datetimes`.

`atoms` is a list of atom objects with the following properties:
* `id` the atom id, incremental and starting from 1 (0 is the 'root')
* `form` the form
* `pos` the POS tag
* `head` the id of the head
* `deprel` the deprel label (can be null)
* `corefs` list of objects: `{"sentenceId": <NUMBER>, "atomId": <NUMBER>}` (can be null)

`entities` is a list of entity objects with the following properties (Optional):
* `start_atom` the first atom index of the atoms list
* `end_atom` the last atom index of the atoms list
* `label` the label to show in the atoms underline

`dates` is a list of dates objects with the following properties (Optional):
* `start_atom` the first atom index of the atoms list
* `end_atom` the last atom index of the atoms list
* `label` the label to show in the atoms underline

Example:
```javascript
[
    {
        "id": 0, // sentence id
        "atoms": [ // list of atom objects
            {
                "id": 1, // id starting from 1
                "form": "DependencyTreeJS",
                "pos": "NN",
                "head": 3, // the id of the head (0 is the 'root')
                "deprel": "subj",
                "corefs": null, // a list of objects: {"sentenceId": <NUMBER>, "atomId": <NUMBER>} (can be null) 
                "sem": null // a list of strings (can be null)
            },
            {
                "id": 2,
                "form": "is",
                "pos": "VB",
                "head": 3,
                "deprel": "cop",
                "corefs": null,
                "sem": null
            },
            {
                "id": 3,
                "form": "awesome",
                "pos": "JJ",
                "head": 0,
                "deprel": "root",
                "corefs": null,
                "sem": null
            }
        ],
        "entities": [ // list of entity objects
            {
                "start_atom": 1,
                "end_atom": 1,
                "label": "ORG"
            },
            {
                "start_atom": 2,
                "end_atom": 3,
                "label": "PER"
            }
        ],
        "datetimes": [ // list of datetime objects
            {
                "start_atom": 1,
                "end_atom": 2,
                "label": "Date"
            },
        ]
    }
]
```


## Custom options

It is possible to pass a custom `options` object:

```javascript
var options = {
    "styles": {
        "sentence": {
            "atom": {
                "minSpacing": 8,
                "pos": {
                    "hover": {
                        "fill": "#7679D8",
                        "font": "11px Helvetica",
                        "font-weight": "bold"
                    }
                }
            },
            "deprel": {
                "path": {
                    "click": {
                        "stroke": "#3788DA",
                        "stroke-width": 1
                    }
                }
            }
        }
    },
    "drawDelay": 100
};

$("#dependency-tree").dependencyTree(options);
```


## The default `options` object

```json
{
    "styles": {
        "sentence": {
            "margin": {
                "vertical": 20,
                "horizontal": 20
            }
        },
        "atom": {
            "minSpacing": 10,

            "rect": {
                "padding": {
                    "horizontal": 10,
                    "vertical": 7
                },
                "normal": {
                    "fill": "",
                    "stroke": "#999",
                    "stroke-width": 1,
                    "r": 4
                },
                "hover": {
                    "fill": "#B5B7EA",
                    "stroke": "#7679D8"
                },
                "click": {
                    "fill": "#81B6EE",
                    "stroke": "#3987DA"
                },
                "underline": {
                    "fill": "#B5B7EA",
                    "stroke": "#7679D8"
                }
            },

            "coref": {
                "rect": {
                    "hover": {
                        "fill": "#B5B7EA",
                        "stroke": "#7679D8"
                    },
                    "click": {
                        "fill": "#81B6EE",
                        "stroke": "#3987DA"
                    }
                }
            },

            "form": {
                "normal": {
                    "fill": "#444",
                    "font": "16px Helvetica"
                },
                "hover": {
                    "fill": "#FFF",
                    "font": "16px Helvetica"
                },
                "click": {
                    "fill": "#FFF",
                    "font": "16px Helvetica"
                }
            },

            "pos": {
                "normal": {
                    "fill": "#7679D8",
                    "font": "11px Helvetica"
                },
                "hover": {
                    "fill": "#7679D8",
                    "font": "11px Helvetica",
                    "font-weight": "bold"
                },
                "click": {
                    "fill": "#3788DA",
                    "font": "11px Helvetica",
                    "font-weight": "bold"
                },
                "spacing": 1
            }
        },
        "deprel": {
            "normal": {
                "fill": "#444",
                "font": "12px Helvetica"
            },
            "hover": {
                "fill": "#7679D8",
                "font": "12px Helvetica"
            },
            "click": {
                "fill": "#3788DA",
                "font": "12px Helvetica"
            },
            "padding": {
                "horizontal": 10
            },
            "spacing": 2,
            "path": {
                "width": 1,
                "spacing": 6,
                "normal": {
                    "stroke": "#666",
                    "arrow-end": "classic-wide-long",
                    "stroke-width": 1
                },
                "hover": {
                    "stroke": "#7679D8",
                    "arrow-end": "classic-wide-long",
                    "stroke-width": 1.5
                },
                "click": {
                    "stroke": "#3788DA",
                    "arrow-end": "classic-wide-long",
                    "stroke-width": 2
                }
            }
        },
        "underline": {
            "height": 10,
            "label": {
                "spacing": 5,
                "normal": {
                    "fill": "#7679D8",
                    "font": "7px Helvetica"
                },
                "hover": {
                    "fill": "#7679D8",
                    "font": "7px Helvetica",
                    "font-weight": "bold"
                }
            },
            "path": {
                "spacing": 10,
                "normal": {
                    "stroke": "#666",
                    "stroke-width": 1
                },
                "hover": {
                    "stroke": "#7679D8",
                    "stroke-width": 1.5
                }
            }
        },
        "level": {
            "height": 30
        }
    },
    "drawDelay": 50
}
```


## License

This software is released under the terms of the 
[Mozilla Public License, v. 2.0](https://mozilla.org/MPL/2.0/ "Mozilla Public License, v. 2.0")


## Contributions

We greatly appreciate any bug reports and contributions, which can be made by filing an issue or making a pull 
request through the [github page](https://github.com/KotlinNLP/DependencyTreeJS "DependencyTreeJS on GitHub").
