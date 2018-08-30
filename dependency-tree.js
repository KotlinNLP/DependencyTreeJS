/**
 * DependencyTreeJS - A plugin to draw parse trees.
 * Copyright (C) 2017 KotlinNLP Authors <github@kotlinnlp.com>
 */

(function($) {
  var DT = {};

  DT = (function() {

    function DT(element, options) {
      var _ = this;

      _.defaultSettings = {
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
      };

      _.settings = $.extend(true, {}, _.defaultSettings, options);
      _.parsed = null;
      _.clickedElement = null;
      _.sentences = [];
      _.sentencesById = {};
      _.callback = null;
      _.wasMouseScrolling = false;

      _.container = $(element);
      _.container.click(function() {
        if (!_.wasMouseScrolling) {
          _.resetClickedElement();
        }
      });

      _.clear();
    }

    DT.prototype.clear = function() {
      var _ = this;
      
      _.parsed = null;
      _.clickedElement = null;
      _.sentences = [];
      _.sentencesById = {};
      _.callback = null;

      _.container.empty();
    };

    DT.prototype.isComplete = function(index) {
      return (index ===  this.parsed_sentences().length)
    };

    DT.prototype.runCallback = function() {
      var _ = this;

      if (typeof _.callback === 'function') {
        _.callback();
      }
    };

    DT.prototype.parsed_sentences = function() {
      var _ = this;
      return _.parsed;
    };

    DT.prototype.draw = function(parsedData, clbk) {
      var _ = this,
          currentSentenceIndex = 0;

      _.clear();
      _.parsed = $.extend(true, [], parsedData);
      _.callback = clbk;

      if (_.isComplete(currentSentenceIndex)) {
        _.runCallback();

      } else {
        _.syncDrawSentence(currentSentenceIndex);
      }
    };

    DT.prototype.drawSentence = function(sentenceIndex, async) {
      var _ = this,
          sentence = _.parsed_sentences()[sentenceIndex],
          nextSentenceIndex = sentenceIndex + 1;

      var sentenceObj = new DTSentence();
      sentenceObj.init(sentence, _.settings);
      sentenceObj.container.DTScrollByDrag({
        mousedown : function() { _.wasMouseScrolling = false; },
        mousemove : function() { _.wasMouseScrolling = true; }
      });

      _.container.append(sentenceObj.container);

      var depsMap = getDepsMap(sentence.atoms);
      
      for (var i = 0; i < sentence.atoms.length; i++) {
        var atom = sentence.atoms[i];
        _.setAtom(sentenceObj, atom, depsMap[atom.id]);
      }

      if (sentence.hasOwnProperty('entities')) {
        _.setUnderlines(sentenceObj, sentence.entities);
      }

      if (sentence.hasOwnProperty('datetimes')) {
        _.setUnderlines(sentenceObj, sentence.datetimes);
      }

      sentenceObj.calculatePositions();
      sentenceObj.setAtomsPositions();
      sentenceObj.drawUnderlines();

      _.sentences.push(sentenceObj);
      _.sentencesById[sentenceObj.id] = sentenceObj;

      // Async draw for the invisible element
      if (!async && (sentenceObj.container.offset().top + sentenceObj.height) > $(window).height()) {
        async = true;
      }

      // Complete
      if (_.isComplete(nextSentenceIndex)) {
        _.runCallback();

      // Draw next sentence
      } else {
        if (async) {
          _.asyncDrawSentence(nextSentenceIndex);
        } else {
          _.syncDrawSentence(nextSentenceIndex);
        }
      }
    };

    DT.prototype.syncDrawSentence = function(sentenceIndex) {
      var _ = this;

      _.drawSentence(sentenceIndex, false);
    };

    DT.prototype.asyncDrawSentence = function(sentenceIndex) {
      var _ = this;

      setTimeout(
        function() { _.drawSentence(sentenceIndex, true); },
        _.settings.drawDelay
      );
    };

    DT.prototype.setUnderlines = function(sentence, underlines) {
      var _ = this;

      for (var i = 0; i < underlines.length; i++) {
        var underline = underlines[i];
        _.setUnderline(sentence, underline);
      }
    };

    DT.prototype.setUnderline = function(sentence, underline) {
      var _ = this,
          underlineObj = new DTUnderline();
      
      underlineObj.init(sentence, underline);
      underlineObj.setDT(_);
      
      sentence.addUnderline(underlineObj);
    };

    DT.prototype.setAtom = function(sentence, atom, atomDeps) {
      var _ = this;

      var atomObj = new DTAtom();
      atomObj.init(atom, sentence.id, atomDeps, _.settings);
      atomObj.setDT(_);
      atomObj.setSentenceRaphael(sentence.raphael);
      atomObj.setArcs();
      atomObj.createGraphicalElements();

      sentence.addAtom(atomObj);
    };

    DT.prototype.resetClickedElement = function() {
      var _ = this,
          memClickedElement;

      if (_.clickedElement !== null) {
        memClickedElement = _.clickedElement;
        _.clickedElement = null;
        elementHoverOut.call(memClickedElement);
      }
    };

    function elementHoverIn() {
      var element = this,
          _ = element.DT;

      if (_.clickedElement !== element) {
        element.setActionStyles('hover');
      }
    }

    function elementHoverOut() {
      var element = this,
          _ = element.DT;

      if (_.clickedElement !== element) {
        element.setActionStyles('normal');

        if (_.clickedElement !== null) {
          _.clickedElement.setActionStyles('click');
        }
      }
    }

    function elementClick(e) {
      var element = this,
          _ = element.DT;
          memClickedElement = _.clickedElement;

      _.resetClickedElement();

      if (memClickedElement !== element) {
        element.setActionStyles('click');
        _.clickedElement = element;
      }

      if (typeof e !== 'undefined') {
        e.stopPropagation();
      }
    }

    function getDepsMap(atoms) {

      var i,
          depsMap = {};

      for (i = 0; i < atoms.length; i++) {
        depsMap[atoms[i].id] = [];
      }

      for (i = 0; i < atoms.length; i++) {
        var atom = atoms[i];

        if (atom.head !== 0) {
          depsMap[atom.head].push(atom.id);
        }
      }

      return depsMap;
    }

    function DTSentence() {
      this.id = null;
      this.atoms = [];
      this.underlines = [];
      this.sortedAtoms = [];
      this.levels = null;
      this.container = null;
      this.raphael = null;
      this.svg = null;
      this.width = 1;
      this.height = 1;
      this.settings = null;

      this.init = function(sentence, settings) {
        this.id = sentence.id;
        this.container = $('<div></div>', {class: 'sentence'});
        this.raphael = Raphael(this.container[0], 1, 1);
        this.svg = this.container.find('svg');
        this.settings = settings;
      };

      this.addAtom = function(atom) {
        this.atoms.push(atom);
      };

      this.addUnderline = function(underline) {
        this.underlines.push(underline);
      };

      this.sortingAtoms = function(a, b) {
        if (a.isRoot()) {
          return 1;
        } else if (b.isRoot()) {
          return -1;
        } else {
          var absA = Math.abs(a.atomHead- a.atomSynId);
          var absB = Math.abs(b.atomHead - b.atomSynId);
          return absA - absB;
        }
      };

      this.getSortedAtoms = function() {
        if (this.sortedAtoms.length > 0) {
          return this.sortedAtoms;
        }

        this.sortedAtoms = this.atoms.slice(); // Copy
        this.sortedAtoms.sort(this.sortingAtoms);

        return this.sortedAtoms;
      };

      this.getIntervalLevel = function(level, firstId, lastId) {
        var intervalIndex = this.getIntervalIndex(level, firstId, lastId),
            intervalsLength = level.length;

        if (intervalIndex !== null) {
          var interval = level[intervalIndex],
              newLevel = level.slice(0, intervalIndex);

          if (firstId > interval.first) {
            newLevel.push({ first: interval.first, last: firstId - 1 });
          }

          if (lastId < interval.last) {
            newLevel.push({ first: lastId + 1, last: interval.last });
          }

          newLevel = newLevel.concat(level.slice(intervalIndex + 1, intervalsLength));

          return newLevel;
        }

        return null;
      };

      this.getIntervalIndex = function(level, firstId, lastId) {
        for (var i = 0; i < level.length; i++) {
          var interval = level[i];

          if (interval.first <= firstId + 1 && interval.last >= lastId - 1) {
            return i;
          }
        }
        return null;
      };

      this.addNewLevel = function(firstId, lastId) {
        var atomsLength = this.getSortedAtoms().length,
            level = [];

        if (firstId > 1) {
          level.push({ first: 1, last: firstId - 1 });
        }
        if (lastId < atomsLength) {
          level.push({ first: lastId + 1, last: atomsLength });
        }

        this.levels.push(level);
      };

      this.deprelLevel = function(atom) {
        var firstId = Math.min(atom.atomSynId, atom.atomHead),
            lastId = Math.max(atom.atomSynId, atom.atomHead);

        for (var i = 0; i < this.levels.length; i++) {
          var intervalLevel = this.getIntervalLevel(this.levels[i], firstId, lastId);

          if (intervalLevel !== null) {
            this.levels[i] = intervalLevel;
            return i + 1;
          }
        }

        this.addNewLevel(firstId, lastId);
        return this.levels.length;
      };

      this.setLevels = function() {
        var sortedAtoms = this.getSortedAtoms(),
            atomsLength = sortedAtoms.length;

        this.levels = [[{ first: 1, last: atomsLength }]];

        for(var i = 0; i < atomsLength; i++) {
          var atom = sortedAtoms[i];
          atom.deprel.level = (atom.isRoot()) ? (this.levels.length + 1) : this.deprelLevel(atom);
        }
      };

      this.setInitialAtomsPosition = function() {
        var levelOuterHeight = this.settings.styles.level.height + this.settings.styles.deprel.spacing,
            atomsTop = this.settings.styles.sentence.margin.vertical + (levelOuterHeight * (this.levels.length + 1));

        for (var i = 0; i < this.atoms.length; i++) {
          var atom = this.atoms[i];
          atom.rect.y = atomsTop;

          if (i === 0) {
            atom.rect.x = this.settings.styles.sentence.margin.horizontal;
          } else {
            var prevAtom = this.atoms[i - 1];
            atom.rect.x = prevAtom.rect.x + prevAtom.rect.width + this.settings.styles.atom.minSpacing;
          }
        }
      };

      this.setSentenceSize = function() {
        var atom = this.atoms[this.atoms.length - 1];
        
        var height = atom.rect.y + atom.rect.height + atom.pos.height + atom.pos.spacing;

        if (this.underlines.length > 0) {
          var underline = this.underlines[this.underlines.length - 1];
          height = underline.path.y + underline.path.height + underline.label.height;
        }

        this.width = atom.rect.x + atom.rect.width + this.settings.styles.sentence.margin.horizontal;
        this.height = height + this.settings.styles.sentence.margin.vertical;
      };

      this.resize = function() {
        this.setSentenceSize();
        this.raphael.setSize(this.width, this.height);
      };

      this.setAtomSpacingTopArcs = function(atom) {
        var deprelWidth = atom.deprel.width + (atom.deprel.padding.horizontal * 2);

        if (deprelWidth > atom.rect.width) {
          var difference = deprelWidth - atom.rect.width;
          atom.rect.x += (difference / 2);

          for(var i = atom.atomSynId; i < this.atoms.length; i++) {
            this.atoms[i].rect.x += difference;
          }
        }
      };

      this.changeDistanceAtoms = function(atom, difference) {
        var governor = this.atoms[atom.atomHead - 1],
            numMidAtoms = Math.abs(atom.atomSynId - governor.atomSynId) - 1,
            spacing = difference / ((numMidAtoms * 2) + 2),
            firstId = Math.min(atom.atomSynId, governor.atomSynId),
            lastId  = Math.max(atom.atomSynId, governor.atomSynId),
            spacingCount = 1;

        for(var i = firstId; i < lastId; i++) {
          spacingCount += 1;
          this.atoms[i].rect.x += (spacing * spacingCount);
          spacingCount += 1;
        }

        spacingCount -= 1;

        for(i = lastId; i < this.atoms.length; i++) {
          this.atoms[i].rect.x += (spacing * spacingCount);
        }
      };

      this.calculatePositions = function() {
        var atomsLength = this.atoms.length,
            sortedAtoms = this.getSortedAtoms();

        this.setLevels();
        this.setInitialAtomsPosition();

        for (var i = atomsLength - 1; i >= 0; i--) {
          var atom = sortedAtoms[i],
              deprelWidth = atom.deprel.width + (atom.deprel.padding.horizontal * 2);

          if (atom.isRoot()) {
            this.setAtomSpacingTopArcs(atom);
          } else {
            var governor = this.atoms[atom.atomHead - 1],
                atomArcX = atom.getArcX(atom.atomHead),
                govArcX = governor.getArcX(atom.atomSynId),
                distance = Math.abs(atomArcX - govArcX);

            if (deprelWidth > distance) {
              var difference  = deprelWidth - distance;
              this.changeDistanceAtoms(atom, difference);
            }
          }
        }

        this.resize();
      };

      this.setAtomsPositions = function() {
        var lenAtoms = this.atoms.length;

        for(var i = 0; i < lenAtoms; i++) {
          var atom = this.atoms[i],
              governor = null;

          if (!atom.isRoot()) {
            governor = this.atoms[atom.atomHead - 1];
          }

          atom.setRectPosition();
          atom.setFormPosition();
          atom.setPosPosition();
          atom.setDeprelPosition(governor);
          atom.setDeprelPath(governor);
        }
      };

      this.drawUnderlines = function() {
        var lenUnderlines = this.underlines.length;

        for(var i = 0; i < lenUnderlines; i++) {
          this.underlines[i].draw();
        }

        this.resize();
      };
    }

    function DTAtom() {
      this.sentenceId = null;
      this.form = null;
      this.surfaceForm = null;
      this.pos = null;
      this.rect = null;
      this.deprel = null;
      this.deprelPath = null;
      this.arcs = null;
      this.raphael = null;
      this.DT = null;

      this.init = function(atom, sentenceId, deps, settings) {
        var style = settings.styles;
        
        this.sentenceId = sentenceId;
        this.arcs = { width: 0, map: {} };
        this.level = { height: style.level.height + style.deprel.spacing };
        this.form = { width: 0, height: 0, element: null, normal: style.atom.form.normal,
          hover: style.atom.form.hover, click: style.atom.form.click };

        this.pos = {
          width: 0, height: 0, element: null, normal: style.atom.pos.normal,
          hover: style.atom.pos.hover, click: style.atom.pos.click,
          spacing: style.atom.pos.spacing
        };

        this.rect = {
          x: 0, y: 0, width: 0, height: 0, element: null, normal: style.atom.rect.normal,
          hover: style.atom.rect.hover, click: style.atom.rect.click,
          underline: style.atom.rect.underline, padding: style.atom.rect.padding
        };

        this.deprel = {
          level: 0, width: 0, height: 0, element: null, padding: style.deprel.padding,
          normal: style.deprel.normal, hover: style.deprel.hover, click: style.deprel.click,
          spacing: style.deprel.spacing
        };

        this.deprelPath = {
          element: null, normal: style.deprel.path.normal, hover: style.deprel.path.hover,
          click: style.deprel.path.click, width: style.deprel.path.width, 
          spacing: style.deprel.path.spacing
        };

        this.coref = {
          hover: style.atom.coref.rect.hover, click: style.atom.coref.rect.click
        };

        this.setAtomAttributes(atom, deps);
      };

      this.setDT = function(DT) {
        this.DT = DT;
      };

      this.isRoot = function() {
        return (this.atomHead === 0)
      };

      this.setSentenceRaphael = function(raphael) {
        this.raphael = raphael;
      };

      this.sortingReverse = function(a, b) {
        return b - a;
      };

      this.setArcs = function() {
        var depsLeft  = [],
            depsRight = [],
            position = 0;

        for (var i = 0; i < this.atomDeps.length; i++) {
          var dep = this.atomDeps[i];

          if (dep < this.atomSynId) {
            depsLeft.push(dep);
          } else {
            depsRight.push(dep);
          }
        }

        depsLeft.sort(this.sortingReverse);
        depsRight.sort(this.sortingReverse);

        position = this.setArcWithDeps(depsLeft, position);
        this.arcs.map[this.atomHead] = position;
        position = this.setArcWithDeps(depsRight, (position + 1));

        this.arcs.width = (position * this.deprelPath.width) +
          ((position - 1) * this.deprelPath.spacing);
      };

      this.setArcWithDeps = function(deps, position) {
        for (var i = 0; i < deps.length; i++) {
          this.arcs.map[ deps[i] ] = position;
          position += 1;
        }

        return position;
      };

      this.createGraphicalElements = function() {
        this.setForm();
        this.setPos();
        this.setRect();
        this.setDeprel();
      };

      this.getDeprelString = function() {
        var deprel = this.atomDeprel,
            semLength = this.atomSem.length;

        if (semLength > 0) {
          deprel += "-";
        }

        return deprel + this.atomSem.join("/");
      };

      this.setForm = function() {
        this.surfaceForm = (this.atomForm === null ? 'Ø' : this.atomForm);
        this.form.element = this.raphael.text(0, 0, this.surfaceForm).attr(this.form.normal);
        this.setBounds(this.form);
        this.form.element.hover(elementHoverIn, elementHoverOut, this, this);
        this.form.element.click(elementClick, this);
      };

      this.setFormPosition = function() {
        this.form.element.attr({
          'text-anchor': 'center',
          x: this.rect.x + (this.rect.width / 2),
          y: this.rect.y + (this.rect.height / 2)
        });
      };

      this.setPos = function() {
        this.pos.element = this.raphael.text(0, 0, this.atomPos).attr(this.pos.normal);
        this.setBounds(this.pos);
      };

      this.setPosPosition = function() {
        this.pos.element.attr({
          'text-anchor': 'center',
          x: this.rect.x + (this.rect.width / 2),
          y: this.rect.y + this.rect.height +
            (this.pos.height / 2) + this.pos.spacing
        });
      };

      this.setRect = function() {
        var innerRectWidth = Math.max(this.form.width, this.pos.width, this.arcs.width);

        this.rect.element = this.raphael.rect(
          0, 0,
          innerRectWidth + (this.rect.padding.horizontal * 2),
          this.form.height + (this.rect.padding.vertical * 2)
        ).attr(this.rect.normal);

        this.setBounds(this.rect);
        this.rect.element.toBack();
        this.rect.element.hover(elementHoverIn, elementHoverOut, this, this);
        this.rect.element.click(elementClick, this);
      };

      this.setRectPosition = function() {
        this.rect.element.attr({ x: this.rect.x, y: this.rect.y });
      };

      this.setDeprel = function() {
        this.deprel.element = this.raphael.text(0, 0, this.getDeprelString()).attr(this.deprel.normal);

        this.setBounds(this.deprel);
      };

      this.setDeprelPosition = function(governor) {
        var atomArcX = this.getArcX(this.atomHead),
            deprelY = this.rect.y - (this.deprel.level * this.level.height),
            deprelX = atomArcX;

        if (governor) {
          deprelX = (atomArcX + governor.getArcX(this.atomSynId)) / 2;
        }

        this.deprel.element.attr({
          'text-anchor': 'center',
          x: deprelX,
          y: deprelY
        });
      };

      this.setDeprelPath = function(governor) {
        var atomArcX = this.getArcX(this.atomHead),
            bbox = this.deprel.element.getBBox(),
            path = [
              'M', bbox.x, bbox.y + bbox.height + this.deprel.spacing,
              'L', bbox.x + bbox.width, bbox.y + bbox.height + this.deprel.spacing,
              'M', atomArcX, bbox.y + bbox.height + this.deprel.spacing,
              'L', atomArcX, this.rect.y
            ];
        
        if (governor) {
          var govArcX = governor.getArcX(this.atomSynId);
          path = [
            'M', govArcX, governor.rect.y,
            'L', govArcX, bbox.y + bbox.height + this.deprel.spacing,
            'L', atomArcX, bbox.y + bbox.height + this.deprel.spacing,
            'L', atomArcX, this.rect.y
          ]
        }

        this.deprelPath.element = this.raphael.path(path).attr(this.deprelPath.normal);
      };

      this.setBounds = function(element) {
        var bBox = element.element.getBBox();
        element.width  = bBox.width;
        element.height = bBox.height;
      };

      this.setActionStyles = function(action) {
        this.form.element.attr(this.form[action]);
        this.rect.element.attr(this.rect[action]);
        this.pos.element.attr(this.pos[action]);

        for (var i = 0; i < this.atomDeps.length; i++) {
          var info = this.atomDeps[i],
              dep = this.DT.sentencesById[this.sentenceId].atoms[info - 1];
          
          dep.deprelPath.element.attr(this.deprelPath[action]);
          dep.deprel.element.attr(this.deprel[action]);
        }

        var corefStyle = (action === 'normal') ? this.rect[action] : this.coref[action];

        for (i = 0; i < this.atomCorefs.length; i++) {
          var sentenceId = this.getSentenceIdByCorefIndex(i),
              atomId = this.getAtomIdByCorefIndex(i),
              corefAtom = this.DT.sentences[sentenceId].atoms[atomId - 1];
          corefAtom.rect.element.attr(corefStyle);
          corefAtom.form.element.attr(this.form[action]);
        }
      };

      this.getArcX = function(relatedID) {
        var position = this.arcs.map[relatedID];

        return this.rect.x + ((this.rect.width - this.arcs.width) / 2) +
          (position * this.deprelPath.width) +
          (position * this.deprelPath.spacing);
      };

      this.getSentenceIdByCorefIndex = function(index) {
        return this.atomCorefs[index].sentenceId;
      };

      this.getAtomIdByCorefIndex = function(index) {
        return this.atomCorefs[index].atomId;
      };

      this.setAtomAttributes = function(atom, deps) {
        this.atomForm = atom.form;
        this.atomPos = atom.pos;
        this.atomDeprel = atom.deprel;
        this.atomHead = atom.head;
        this.atomSynId = atom.id;
        this.atomDeps = deps;
        this.atomCorefs = atom.corefs || [];
        this.atomSem = atom.sem || [];
      }
    }

    function DTUnderline() {
      this.sentence = null;
      this.firstIndex = null;
      this.lastIndex = null;
      this.label = null;
      this.path = null;
      this.DT = null;

      this.init = function(sentence, underline) {
        this.sentence = sentence;
        this.firstIndex = underline.start_atom;
        this.lastIndex = underline.end_atom;
        var style = sentence.settings.styles;

        this.label = { element: null, text: underline.label, normal: style.underline.label.normal,
          hover: style.underline.label.hover, click: style.underline.label.click,
          spacing: style.underline.label.spacing
        };

        this.path = {
          x: 0, y: 0, width: 0, height: style.underline.height, element: null,
          normal: style.underline.path.normal, hover: style.underline.path.hover,
          click: style.underline.path.click, spacing: style.underline.path.spacing
        };
      };

      this.setDT = function(DT) {
        this.DT = DT;
      };

      this.setPath = function() {
        var firstAtom = this.sentence.atoms[this.firstIndex];
        var lastAtom = this.sentence.atoms[this.lastIndex];
        this.path.x = firstAtom.rect.x;
        this.path.y = firstAtom.rect.y + firstAtom.rect.height + firstAtom.pos.height + firstAtom.pos.spacing + this.path.spacing;
        this.path.width = lastAtom.rect.x + lastAtom.rect.width - firstAtom.rect.x;

        this.path.element = this.sentence.raphael.path(
          [
            'M', this.path.x, this.path.y,
            'L', this.path.x, this.path.y + this.path.height,
            'L', this.path.x + this.path.width, this.path.y + this.path.height,
            'L', this.path.x + this.path.width, this.path.y
          ]
        ).attr(this.path.normal);

        this.setBounds(this.path);
      };

      this.setLabel = function() {
        var pathBbox = this.path.element.getBBox();
        this.label.element = this.sentence.raphael.text(0, 0, this.label.text).attr(this.label.normal);
        this.label.element.attr({
          'text-anchor': 'center',
          x: pathBbox.x + (pathBbox.width / 2),
          y: pathBbox.y + pathBbox.height + (this.label.spacing * 2)
        });

        this.setBounds(this.label);
        this.label.element.toBack();
        this.label.element.hover(elementHoverIn, elementHoverOut, this, this);
      };

      this.setBounds = function(element) {
        var bBox = element.element.getBBox();
        element.width  = bBox.width;
        element.height = bBox.height;
      };

      this.draw = function() {
        this.setPath();
        this.setLabel();
      };

      this.setActionStyles = function(action) {
        this.path.element.attr(this.path[action]);
        this.label.element.attr(this.label[action]);

        for (var i = this.firstIndex; i <= this.lastIndex; i++) {
          var atom = this.sentence.atoms[i],
              style = action === 'hover' ? 'underline' : 'normal';

          atom.rect.element.attr(atom.rect[style]);
        }
      };
    }

    $.fn.DTScrollByDrag = function(options) {
      var settings = $.extend({
          mousedown : null,
          mousemove : null,
          mouseup   : null
      }, options);

      var element = $(this),
          clicked = false,
          memX, memY,
          memScrollTop, memScrollLeft;

      element.on({
        mousedown: function (e) {
          clicked = true;

          memX = e.pageX;
          memY = e.pageY;

          memScrollTop = element.scrollTop();
          memScrollLeft = element.scrollLeft();
          element.css('cursor', 'pointer');

          if (settings.mouswdown !== null) {
            settings.mousedown(e);
          }
        }
      });

      $(window).on({
        mousemove: function(e) {
          if (clicked) {
            element.scrollTop(memScrollTop + (memY - e.pageY));
            element.scrollLeft(memScrollLeft + (memX - e.pageX));

            if (settings.mousemove !== null) {
              settings.mousemove(e);
            }
          }
        },
        mouseup: function() {
          if (clicked) {
            clicked = false;
            element.css('cursor', 'default');

            if (settings.mouseup !== null) {
              settings.mouseup();
            }
          }
        }
      });

      return this;
    };

    return DT;
  }());

  $.fn.dependencyTree = function(options) {
    var element = this instanceof $ ? this : $(this),
        dependencyTree = new DT(element, options);

    $.data(element[0], "_dependencyTree", dependencyTree);
    
    return dependencyTree;
  };
}(jQuery));
