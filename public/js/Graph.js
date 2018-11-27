function Graph(div) {

    var width = 2000,
        height = 2000;
    var self = this;
   
    var createNewLinkLine = function(group) {

        return group.append("line")
            .attr("class", "newlink")
            .attr("stroke-dasharray", "3,3");
    }
    
    var svg = d3.select("svg");
    var svgGroup = svg.append("g");
    var svgLine = createNewLinkLine(svgGroup);
    var svgSelection = null;
    var currentGraph = null;
    var link, node, labels, icons, texts;
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    var simulation;
    var zoom;
    var new_node_position = { x: 0, y: 0 };
    var nodePositionCache = {};

    function BoundingBox(W, H, center, w, h, margin) {
        var k, kh, kw, x, y;
        kw = (W - margin) / w;
        kh = (H - margin) / h;
        k = d3.min([kw, kh]);
        x = W / 2 - center.x * k;
        y = H / 2 - center.y * k;
        return d3.zoomIdentity.translate(x, y).scale(k);
    };

    function center(x,y) {
        svg.transition()
            .duration(300)
            .call(zoom.translateTo, x, y);
    }

    function IsCategoryNode(node) {
        return false;
        //return node.nodeType == "category";
    }

    function IsRootNode(node) {
        return false;
        //return node.nodeType == "root";
    }

    function removeSelection() {
        if (svgSelection != null)
            svgSelection.remove();
    }

    function createNodePreview(container, x, y) {

        var preview = container.append("circle")
            .attr("class", "node_preview")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", "10");

        LoopStrokeWidth(preview);
        return preview;

    }

    function zoomed() {
        svgGroup.attr("transform", d3.event.transform);
    }
    function updateSelectionWidget(container, newSelection) {

        removeSelection();
        currentGraph.selection = newSelection;
        var size = newSelection.size;

        var shape = CreateShape(null, newSelection);
        svgSelection = container
            .append("rect")
            .style("fill", "transparent")
            .style("stroke", "#ccff00")
            .style("stroke-width", "1")
            .attr("pointer-events", "none")
            .attr("width", size)
            .attr("height", size / 2)
            .attr("rx", size * 0.2)
            .attr("ry", (size / 2) * 0.5)
            .attr("x", newSelection.x)
            .attr("y", newSelection.y);

        return svgSelection;
    }
    function nodeCenter(d) {

        return { x: d.x - (d.size / 2), y: d.y - (d.size  / 2 / 2) };
    }
    function interpolatedZoom(factor) {

        zoom.scaleTo(svg.transition().duration(750), factor);
    }
    function dragstarted(d) {

        if (!d3.event.active) simulation.alphaTarget(0.3).restart();

        removeSelection();

        if (IsCategoryNode(d) || IsRootNode(d)) {
            currentGraph.selection = d;
            svgLine.attr("x1", d.x);
            svgLine.attr("y1", d.y);
            svgLine.attr("x2", d.x);
            svgLine.attr("y2", d.y);
        } else {
            d.fx = d.x;
            d.fy = d.y;
        }
    }

    function dist(x1, x2, y1, y2) {
        return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
    }

    function dragged(d) {

        if (IsCategoryNode(d) || IsRootNode(d)) {
            svgLine.attr("x2", d3.event.x);
            svgLine.attr("y2", d3.event.y);
        } else {

            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }
    }

    function dragended(d) {

        PingNode(d);

        if (!d3.event.active) simulation.alphaTarget(0);

        if (IsCategoryNode(d) || IsRootNode(d)) {

            var lineLength = dist(svgLine.attr("x1"), svgLine.attr("x2"), svgLine.attr("y1"), svgLine.attr("y2"));

            if (lineLength < (d.size / 2)) {
                svgLine.attr("x1", -1);
                svgLine.attr("y1", -1);
                svgLine.attr("x2", -1);
                svgLine.attr("y2", -1);
                return;
            }

            createNodePreview(svgGroup, d3.event.x, d3.event.y);

            new_node_position.x = d3.event.x;
            new_node_position.y = d3.event.y;

            if (IsCategoryNode(d))
                createAddRelationPopover(window.event.clientX, window.event.clientY, d);
            if (IsRootNode(d))
                createCategoryEnumerationPopover(window.event.clientX, window.event.clientY, d);

        } else {

            d.fx = null;
            d.fy = null;
        }
    }

    function PingNode(d, i) {

        removeSelection();

        if (d3.event.defaultPrevented) return;

        updateSelectionWidget(svgGroup, d);
        
        d3.select("#" + IdOf(d)).transition()
            .duration(150)
            .style('stroke-width', 2)
            .transition()
            .duration(100)
            .style('stroke-width', 0.5);

        /*GetUnityKG().then(function (kg) {
            kg.SelectNode(IdOf(d), d.nodeType);
        });*/
    }

    function LoopStrokeWidth(d) {
        d.transition()
            .duration(1000)
            .style('stroke-width', 2)
            .transition()
            .duration(800)
            .style('stroke-width', 0.5)
            .on("end", function () {
                LoopStrokeWidth(d);
            });
    }

    function createCategoryEnumerationPopover(x, y, node) {

        console.log("not impl:createCategoryEnumerationPopover")
        /*GetUnityKG().then(function (kg) {
            kg.GetRelationTypes(IdOf(node), function (error, categories) {
                createPopoverFromTemplate(x, y, "templates/addCategory.html", { "node": node, "categories": categories }, "Add a New Trait Category");
            });
        });*/
    }

    function computeNodeColor(node) {

        var c = color(node.group);

        if (node.nodeType == "node") {
            var w3 = new w3color(c);
            w3.darker(10);
            return w3.toHexString();
        }
        return c;
        //
    }

    function ticked() {


        /*link
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });
            */
        link.attr("d", function (d) {

            var a = [d.source.x, d.source.y], b = [d.target.x, d.target.y];
            var nodeRect = [d.target.x - (SizeOf(d.target) / 2.0),
                            d.target.y - (SizeOf(d.target) / 4.0),
                            d.target.x + (SizeOf(d.target) / 2.0),
                            d.target.y + (SizeOf(d.target) / 4.0)];

            clip(a, b, nodeRect); // returns 1 - "clipped"
            
            var target_x = a[0];//d.target.x;
            var target_y = a[1];//d.target.y;// + SizeOf(d) / 4.0;
            
            var dx = target_x - d.source.x,
                dy = target_y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + target_x + "," + target_y;
        });

        node
            .attr("x", function (d) { return d.x - (d.size / 2); })
            .attr("y", function (d) { return d.y - (d.size / 2 / 2); })
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; });

        labels.attr("transform", function (d) {
            var c = nodeCenter(d);
            return "translate(" + c.x + "," + c.y + ")";
        });

        /*icons.attr("transform", function (d) {
            var c = nodeCenter(d);
            return "translate(" + c.x + "," + c.y + ")";
        });*/

        if (svgSelection != null && currentGraph != null && currentGraph.selection != null) {
            svgSelection.attr("x", currentGraph.selection.x - (currentGraph.selection.size / 2));
            svgSelection.attr("y", currentGraph.selection.y - (currentGraph.selection.size / 2 / 2));
        }
    }

    function createPopover(x, y, content, title, description, callback) {

        $(".popover_container").remove();
        $("#popover").remove();

        var container = $("<span id='popover' data-toggle='popover'></span>");
        container.appendTo("#popover_parent");

        $("<div class='popover_container'></div>")
            .css("top", y)
            .css("left", x)
            .css("position", "absolute")
            .appendTo("body");

        var popOverSettings = {
            container: '.popover_container',
            placement: 'bottom',
            html: true,
            animation: true,
            content: function () {
                return content;
            }
        };

        container.popover(popOverSettings);
        container.on('shown.bs.popover', function () {
            $(".popover_container").find("#popover_title").text(title);
            $(".popover_container").find("#popover_definition").text("Select or create new relations");
            $(".popover_container").find("#close_popover").click(function () { hidePopover(); });
            if (callback != null)
                callback();
        });
        
        
        container.popover("show");
    }

    function SizeOf(node)
    {
        return 20.0;
    }

    function DistanceOf(link)
    {
        if (link.target.objectType == "Trait")
            return 20;
        return 30
    }

    function IdOf(node) {
        return "_" + UniqueIdOf(node);
    }

    function hidePopover() {
        $("#popover").popover("hide");
        $(".popover_container").remove();
        $(".node_preview").remove();
        svgLine.attr("x1", -1);
        svgLine.attr("y1", -1);
        svgLine.attr("x2", -1);
        svgLine.attr("y2", -1);
    }

    function UniqueIdOf(node) {
        return node.parentInstanceId + node.instanceId;
    }

    function Distinct(array)
    {
        var distinct = []
        var filtered = [];
        for (var i = 0; i < array.length; i++) {
            if (distinct.indexOf(UniqueIdOf(array[i])) >= 0)
                continue;
            filtered.push(array[i])
            distinct.push(UniqueIdOf(array[i]))
        }
        return filtered
    }

    function flat(node) {
        
        var children = node.children;
        _.each(children, function(child) {
            children = children.concat(flat(child));
        });
        return children;
    }

    function buildNode(node, a, b)
    {
        console.log(node, a, b);
    }

    function CreateCircleShape(self, node) {
        return d3.select(self)
        .append("circle")
        .attr("r", function (d) {
            return d.size / 2.0;
        });
    }

    function CreateGroupShape(self, node) {
        return d3.select(self)
        .append("circle")
        .attr("r", function (d) {
            return d.size / 3.0;
        });
    }

    function CreateRootShape(self, node) {
        return d3.select(self)
        .append("circle")
        .attr("r", 20);
    }

    function CreateShapeTrait(self, node) {

        return d3.select(self)
         .append("rect")
         .attr("shape", function (d) { return d.objectType; })
         .attr("width", function (d) {
             return d.size;
         })
         .attr("height", function (d) {
             return d.size / 2;
         })
         .attr("rx", function (d) {
             return d.size * 0.2;
         })
         .attr("ry", function (d) {
             return (d.size / 2) * 0.5;
         }).on('click', function (d, i) {
             //transform = to_bounding_box(width, height, center, d.s1, d.s2, height / 10);
             //svg.transition().duration(2000).call(zoom.transform, transform);
         }).on("dblclick", function (d)
         {
             Operations().then(function (op) {
                 op.SetSelection(d.name, function (err, root) {
                 });
                 Rebuild();
             });
         })
    }

    function zoomFit(group, paddingPercent, transitionDuration) {

        var bounds = group.node().getBBox();
        var parent = group.node().parentElement;
        var fullWidth = parent.clientWidth,
            fullHeight = parent.clientHeight;
        var width = bounds.width,
            height = bounds.height;
        var midX = bounds.x + width / 2,
            midY = bounds.y + height / 2;
        if (width == 0 || height == 0) return; // nothing to fit
        var scale = (paddingPercent || 0.75) / Math.max(width / fullWidth, height / fullHeight);
        var translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        zoom.translateTo(svg.transition().duration(transitionDuration), translate[0], translate[1]);
        zoom.scaleTo(svg.transition().duration(transitionDuration), 1 / scale);
    }

    function GetCachedPosition(oldPositions, node)
    {
        var previousPos = {x : 0, y : 0}
        if (oldPositions != null && oldPositions != undefined) {
            _.each(oldPositions, function (oldNode) {
                if (oldNode.name == node.name) {
                    previousPos.x = oldNode.x;
                    previousPos.y = oldNode.y;
                }
            });
        }
        return previousPos;
    }

    function CreateShape(self, node) 
    {
        var shape = null;
        if (node.objectType == "Module")
            shape = CreateCircleShape(self, node);
        else if (node.objectType == "group")
            shape = CreateGroupShape(self, node);
        else if (node.objectType == "root")
            shape = CreateRootShape(self, node);
        else {
            shape = CreateShapeTrait(self, node);
        }

        var classes = "node";
        if (node.root !== undefined)
            classes += " root"

        return shape
                .attr("id", function (d) { return IdOf(d); })
                .attr("class", classes);
    }
    /*function createAddRelationPopover(x, y, node) {

        createPopover(x,
                    y,
                    $('#popover-content').html(),
                    node.name.toLowerCase() + ":",
                    node.definition, function () {
                        $("#new_relation").attr("placeholder", "new " + node.name);

                        if (rootNode != null) {
                            GetUnityKG().then(function (kg) {
                                kg.GetEntityRelations(node.parentId, "IsA", function (error, relations) {
                                    kg.GetAllLocallyDefinedTraits(function (error, localTraits) {

                                        localTraits = _.filter(localTraits, function (t) {
                                            t != node.name;
                                        });
                                        if (localTraits.length == 0) {
                                            localTraits = relations;
                                        }
                                        localTraits = _.filter(localTraits, function (t) {
                                            return _.some(rootNode.nodes, function (node) {
                                                return node.name == t;
                                            });
                                        });
                                        
                                        var inputtags = $(".popover_container").find("#input-tags");

                                        if (localTraits.length > 0) {

                                            var suggestions = "";

                                            // add suggestion badges
                                            _.forEach(localTraits, function (e) {
                                                var badge = $("<span class='badge badge-secondary suggestion'>" + e + "</span>");
                                                badge.on("click", function (d) {

                                                    kg.AddRelation(node.name, $(d.target).text(), function (error) {
                                                        restart();
                                                        badge.remove();
                                                    });
                                                });
                                                badge.appendTo(inputtags);
                                            })
                                        }
                                    });
                                })
                            });
                        }
                    });
    }*/

    simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function (d) {
            return IdOf(d);
        }).distance(function (d) {
            return DistanceOf(d);
        }).strength(1))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    var Rebuild = function () {

        var oldNodes = [];
        
        if (currentGraph != null)
            oldNodes = currentGraph.nodes;

        /*Operations().then(function (op) {
            op.GetModules(function (err, modules) {
                console.log(modules);
                _.each(modules, function (module) {
                    op.GetArchetypes(module, function (err, archetypes) {
                        console.log(archetypes);
                    });
                    op.GetTraits(module, function (err, traits) {
                        console.log(traits);
                        _.each(traits, function (trait) {
                            op.GetProperties(trait, function(err, properties) {
                                console.log("props:", properties);
                            });
                        });
                    });
                });
            });
        });*/

        Operations().then(function (op) {
            op.GetSelection(function (err, root) {
                if (err) {
                    console.error(err);
                    throw err;
                }
                try {
                    currentGraph = {};
                    currentGraph.links = [];
                    currentGraph.selection = null;
                    currentGraph.nodes = Distinct(flat(root[0]));
                    root[0].root = true;
                    currentGraph.root = root[0]
                    currentGraph.nodes.push(root[0])
                    
                    var oldPositions = null;
                    if (nodePositionCache.hasOwnProperty(root[0].name)) {
                        oldPositions = nodePositionCache[root[0].name];
                    }

                    _.each(currentGraph.nodes, function (node)
                    {
                        var cachedPosition = GetCachedPosition(oldPositions, node);
                        node.x = cachedPosition.x;
                        node.y = cachedPosition.y;
                        node.size = SizeOf(node);
                    });

                    _.each(currentGraph.nodes, function (node) {
                        _.each(node.children, function (nodeLink) {
                            currentGraph.links.push({ source: IdOf(node), target: IdOf(nodeLink) });
                        });
                    });

                    nodePositionCache[root[0].name] = currentGraph.nodes;

                    if (currentGraph.nodes.length === 0) {

                        $(".loading").hide();
                        addObject();
                        return;
                    }
                    
                    var nodeNames = currentGraph.nodes.map(function (e) { return IdOf(e); });
                    var oldNodeNames = oldNodes.map(function (e) { return IdOf(e); });
                    /*
                    // reposition nodes we already know
                    for (var n = 0; n < oldNodes.length; n++) {
                        var io = nodeNames.indexOf(IdOf(oldNodes[n]));
                        if (io >= 0) {
                            currentGraph.nodes[io].x = oldNodes[n].x;
                            currentGraph.nodes[io].y = oldNodes[n].y;
                            currentGraph.nodes[io].vx = oldNodes[n].vx;
                            currentGraph.nodes[io].vy = oldNodes[n].vy;
                        }
                    }
                    
                    if (oldNodes.length > 0) {
                        // position newly introduced nodes
                        for (var n = 0; n < currentGraph.nodes.length; n++) {
                            var isNewlyIntroduced = oldNodeNames.indexOf(IdOf(currentGraph.nodes[n])) < 0;
                            if (isNewlyIntroduced) {
                                currentGraph.nodes[n].x = new_node_position.x;
                                currentGraph.nodes[n].y = new_node_position.y;
                                currentGraph.nodes[n].vx = 0.5;
                                currentGraph.nodes[n].vy = 0.5;
                            }
                        }
                    }*/
                    
                    svgGroup.selectAll("*").remove();

                    // build the arrow.
                    svg.append("svg:defs").selectAll("marker")
                        .data(["end"])      // Different link/path types can be defined here
                      .enter().append("svg:marker")    // This section adds in the arrows
                        .attr("id", String)
                        .attr("viewBox", "0 -5 10 10")
                        .attr("refX", 10)
                        .attr("refY", 0)
                        .attr("markerWidth", 4)
                        .attr("markerHeight", 4)
                        .attr("orient", "auto")
                      .append("svg:path")
                        .attr("d", "M0,-5L10,0L0,5")
                        .attr("stroke", "white")
                        .attr("fill", "white");

                    svgLine = createNewLinkLine(svgGroup);

                    zoom = d3.zoom()
                        .scaleExtent([1, 40])
                        .on("zoom", zoomed);
                    
              /*      link = svgGroup.append("g")
                        .attr("class", "links")
                        .selectAll("line")
                        .data(currentGraph.links)
                        .enter().append("line")
                        .attr("id", function (d) {
                            return "link_" + d.target + "_" + d.source;
                        })
                        .attr("source", function (d) {
                            return d.source;
                        })
                        .attr("target", function (d) {
                            return d.target;
                        })
                        .attr("stroke-width", function (d) {
                            return 0.5;
                        });*/
                    
                    link = svgGroup.append("g")
                        .attr("class", "links")
                        .selectAll("path")
                        .data(currentGraph.links)
                        .enter().append("path")
                        .attr("stroke", "white")
                        .attr("fill", "transparent")
                        .attr("marker-end", "url(#end)")
                        .attr("id", function (d) {
                            return "link_" + d.target + "_" + d.source;
                        })
                        .attr("source", function (d) {
                            return d.source;
                        })
                        .attr("target", function (d) {
                            return d.target;
                        })
                        .attr("stroke-width", function (d) {
                            return 0.5;
                        });

                    node = svgGroup.append("g")
                        .attr("class", "nodes")
                        .selectAll("rect")
                        .data(currentGraph.nodes)
                        .enter()
                        .each(function (d, i) {
                            CreateShape(this, d)
                            .attr("fill", computeNodeColor)
                            .on('mouseover', function (d) {
                                if (!IsCategoryNode(d))
                                    return;
                                d3.select(this)
                                    .transition()
                                    .duration(200)
                                    .style('stroke-width', 2)
                            })
                            .on('mouseout', function (d) {
                                if (!IsCategoryNode(d))
                                    return;
                                d3.select(this)
                                    .transition()
                                    .duration(150)
                                    .style('stroke-width', 0.5)
                            })
                            .on("click", PingNode)
                            .call(d3.drag()
                                .on("start", dragstarted)
                                .on("drag", dragged)
                                .on("end", dragended));
                            });

                    // labels
                    labels = svgGroup.append("g")
                        .attr("class", "labels")
                        .selectAll("g")
                        .data(currentGraph.nodes)
                        .enter().append("g")
                        .attr("class", "text")
                        .attr("id", function (d) {
                            return "label_" + IdOf(d);
                        });
                    
                    labels.append("rect").attr("height", function (d) {
                        return d.size / 2;
                    }).attr("width", function (d) {
                        return d.size;
                    }).attr("fill", "transparent")
                        .attr("pointer-events", "none");

                    labels.append("text")
                        .attr("x", function (d) {
                            return d.size / 2;
                        })
                        .attr("y", function (d) {
                            return (d.size / 2) / 2;
                        })
                        .style("font-size", function (d) {
                            var numberOfCharacterThatFits = d.size / 5;
                            return Math.min(4, (numberOfCharacterThatFits / d.name.length) * 6);

                        })
                        .attr("alignment-baseline", "middle")
                        .attr("text-anchor", "middle")
                        .attr("pointer-events", "none")
                        .text(function (d) {
                            return d.name;
                        });
                    
                    // icons layer
                    /*
                    icons = svgGroup.append("g")
                        .attr("class", "icons")
                        .selectAll("g")
                        .data(graph.nodes)
                        .enter().append("g")
                        .attr("class", "text")
                        .attr("id", function (d) {
                            return "icon_" + IdOf(d);
                        });
    
                    icons.append("circle")
                        .attr("cx", 0)
                        .attr("cy", 0)
                        .attr("r", "1")
                        .attr("fill", "blue")
                        .attr("pointer-events", "none");
     
                    icons.append("text")
                            .style("font-family","FontAwesome")
                            .attr("x", function (d) {
                                return 0;
                            })
                            .attr("y", function (d) {
                                return 0;
                            })
                            .style("font-size", function(d)  {
                                return 4;    
                            })
                            .attr("alignment-baseline", "middle")
                            .attr("text-anchor", "middle")
                            .attr("pointer-events", "none")
                            .text(function(d) { return '\uf144'; });
                    */

                    node = svgGroup.selectAll(".node");

                    node.append("title")
                        .text(function (d) {
                            return d.definition;
                        });
                    
                    simulation
                        .nodes(currentGraph.nodes)
                        .on("tick", ticked);
                    
                    simulation.force("link")
                        .links(currentGraph.links);
                    
                    svg.call(zoom);

                    $(".loading").hide();

                    $("#breadcrumb").empty();
                    
                    simulation.alphaTarget(0.3).restart();
                  
                    transform = BoundingBox(width, height, {
                        x: 2150 / 2,
                        y: 2250 / 2
                    }, 400, 400, 200);

                    zoom.transform(svg.transition().duration(200), transform)
                } catch (E) {
                    console.log(E);
                }
            });
        }, function (Error) {
            ShowError(Error);
        });
    }

    RenderTemplate("templates/Graph.html", div).then(function (html) {

        try {
            Rebuild();
        } catch (e) {
            console.log(e);
        }
    });

    var graph_api = { 
        Rebuild: function () 
        { 
            Rebuild();
        } 
    };
    return graph_api;
}

function inteceptCircleLineSeg(circle, line) {
    var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
    v1 = {};
    v2 = {};
    v1.x = line.p2.x - line.p1.x;
    v1.y = line.p2.y - line.p1.y;
    v2.x = line.p1.x - circle.center.x;
    v2.y = line.p1.y - circle.center.y;
    b = (v1.x * v2.x + v1.y * v2.y);
    c = 2 * (v1.x * v1.x + v1.y * v1.y);
    b *= -2;
    d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.radius * circle.radius));
    if (isNaN(d)) { // no intercept
        return [];
    }
    u1 = (b - d) / c;  // these represent the unit distance of point one and two on the line
    u2 = (b + d) / c;
    retP1 = {};   // return points
    retP2 = {}
    ret = []; // return array
    if (u1 <= 1 && u1 >= 0) {  // add point if on the line segment
        retP1.x = line.p1.x + v1.x * u1;
        retP1.y = line.p1.y + v1.y * u1;
        ret[0] = retP1;
    }
    if (u2 <= 1 && u2 >= 0) {  // second add point if on the line segment
        retP2.x = line.p1.x + v1.x * u2;
        retP2.y = line.p1.y + v1.y * u2;
        ret[ret.length] = retP2;
    }
    return ret;
}
