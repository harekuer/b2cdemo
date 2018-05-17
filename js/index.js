function init(index) {
  if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
  var objGo = go.GraphObject.make;  // for conciseness in defining templates

  myDiagram =
    objGo(go.Diagram, "myDiagramDiv",  // must name or refer to the DIV HTML element
      {
        initialContentAlignment: go.Spot.Center,
        allowDrop: true,  // must be true to accept drops from the Palette
        "LinkDrawn": showLinkLabel,  // this DiagramEvent listener is defined below
        "LinkRelinked": showLinkLabel,
        "animationManager.duration": 800, // slightly longer than default (600ms) animation
        "undoManager.isEnabled": true  // enable undo & redo
      });

  // when the document is modified, add a "*" to the title and enable the "Save" button
  myDiagram.addDiagramListener("Modified", function(e) {
    var button = document.getElementById("SaveButton");
    if (button) button.disabled = !myDiagram.isModified;
    var idx = document.title.indexOf("*");
    if (myDiagram.isModified) {
      if (idx < 0) document.title += "*";
    } else {
      if (idx >= 0) document.title = document.title.substr(0, idx);
    }
  });

  // helper definitions for node templates

  function nodeStyle() {
    return [
      // The Node.location comes from the "loc" property of the node data,
      // converted by the Point.parse static method.
      // If the Node.location is changed, it updates the "loc" property of the node data,
      // converting back using the Point.stringify static method.
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      {
        // the Node.location is at the center of each node
        locationSpot: go.Spot.Center,
        //isShadowed: true,
        //shadowColor: "#888",
        // handle mouse enter/leave events to show/hide the ports
        mouseEnter: function (e, obj) { showPorts(obj.part, true); },
        mouseLeave: function (e, obj) { showPorts(obj.part, false); }
      }
    ];
  }

  // Define a function for creating a "port" that is normally transparent.
  // The "name" is used as the GraphObject.portId, the "spot" is used to control how links connect
  // and where the port is positioned on the node, and the boolean "output" and "input" arguments
  // control whether the user can draw links from or to the port.
  function makePort(name, spot, output, input) {
    // the port is basically just a small circle that has a white stroke when it is made visible
    return objGo(go.Shape, "Circle",
             {
                fill: "transparent",
                stroke: null,  // this is changed to "white" in the showPorts function
                desiredSize: new go.Size(8, 8),
                alignment: spot, alignmentFocus: spot,  // align the port on the main Shape
                portId: name,  // declare this object to be a "port"
                fromSpot: spot, toSpot: spot,  // declare where links may connect at this port
                fromLinkable: output, toLinkable: input,  // declare whether the user may draw links to/from here
                cursor: "pointer"  // show a different cursor to indicate potential link point
             });
  }

  // define the Node templates for regular nodes

  var lightText = 'whitesmoke';

  myDiagram.nodeTemplateMap.add("",  // the default category
    objGo(go.Node, "Spot", nodeStyle(),
      // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
      objGo(go.Panel, "Auto",
        objGo(go.Shape, "Rectangle",
          { fill: "#00A9C9", stroke: null },
          new go.Binding("figure", "figure")),
        objGo(go.TextBlock,
          {
            font: "bold 11pt Helvetica, Arial, sans-serif",
            stroke: lightText,
            margin: 8,
            maxSize: new go.Size(160, NaN),
            wrap: go.TextBlock.WrapFit,
            editable: true
          },
          new go.Binding("text").makeTwoWay())
      ),
      // four named ports, one on each side:
      makePort("T", go.Spot.Top, false, true),
      makePort("L", go.Spot.Left, true, true),
      makePort("R", go.Spot.Right, true, true),
      makePort("B", go.Spot.Bottom, true, false)
    ));

  myDiagram.nodeTemplateMap.add("Start",
    objGo(go.Node, "Spot", nodeStyle(),
      objGo(go.Panel, "Auto",
        objGo(go.Shape, "Circle",
          { minSize: new go.Size(40, 40), fill: "#79C900", stroke: null }),
        objGo(go.TextBlock, "Start",
          { font: "bold 11pt Helvetica, Arial, sans-serif", stroke: lightText },
          new go.Binding("text"))
      ),
      // three named ports, one on each side except the top, all output only:
      makePort("L", go.Spot.Left, true, false),
      makePort("R", go.Spot.Right, true, false),
      makePort("B", go.Spot.Bottom, true, false)
    ));

  myDiagram.nodeTemplateMap.add("End",
    objGo(go.Node, "Spot", nodeStyle(),
      objGo(go.Panel, "Auto",
        objGo(go.Shape, "Circle",
          { minSize: new go.Size(40, 40), fill: "#DC3C00", stroke: null }),
        objGo(go.TextBlock, "End",
          { font: "bold 11pt Helvetica, Arial, sans-serif", stroke: lightText },
          new go.Binding("text"))
      ),
      // three named ports, one on each side except the bottom, all input only:
      makePort("T", go.Spot.Top, false, true),
      makePort("L", go.Spot.Left, false, true),
      makePort("R", go.Spot.Right, false, true)
    ));

  myDiagram.nodeTemplateMap.add("Comment",
    objGo(go.Node, "Auto", nodeStyle(),
      objGo(go.Shape, "File",
        { fill: "#EFFAB4", stroke: null }),
      objGo(go.TextBlock,
        {
          margin: 5,
          maxSize: new go.Size(200, NaN),
          wrap: go.TextBlock.WrapFit,
          textAlign: "center",
          editable: true,
          font: "bold 12pt Helvetica, Arial, sans-serif",
          stroke: '#454545'
        },
        new go.Binding("text").makeTwoWay())
      // no ports, because no links are allowed to connect with a comment
    ));


  // replace the default Link template in the linkTemplateMap
  myDiagram.linkTemplate =
    objGo(go.Link,  // the whole link panel
      {
        routing: go.Link.AvoidsNodes,
        curve: go.Link.JumpOver,
        corner: 5, toShortLength: 4,
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true,
        resegmentable: true,
        // mouse-overs subtly highlight links:
        mouseEnter: function(e, link) { link.findObject("HIGHLIGHT").stroke = "rgba(30,144,255,0.2)"; },
        mouseLeave: function(e, link) { link.findObject("HIGHLIGHT").stroke = "transparent"; }
      },
      new go.Binding("points").makeTwoWay(),
      objGo(go.Shape,  // the highlight shape, normally transparent
        { isPanelMain: true, strokeWidth: 8, stroke: "transparent", name: "HIGHLIGHT" }),
      objGo(go.Shape,  // the link path shape
        { isPanelMain: true, stroke: "gray", strokeWidth: 2 }),
      objGo(go.Shape,  // the arrowhead
        { toArrow: "standard", stroke: null, fill: "gray"}),
      objGo(go.Panel, "Auto",  // the link label, normally not visible
        { visible: false, name: "LABEL", segmentIndex: 2, segmentFraction: 0.5},
        new go.Binding("visible", "visible").makeTwoWay(),
        objGo(go.Shape, "RoundedRectangle",  // the label shape
          { fill: "#F8F8F8", stroke: null }),
        objGo(go.TextBlock, "Yes",  // the label
          {
            textAlign: "center",
            font: "10pt helvetica, arial, sans-serif",
            stroke: "#333333",
            editable: true
          },
          new go.Binding("text").makeTwoWay())
      )
    );

  // Make link labels visible if coming out of a "conditional" node.
  // This listener is called by the "LinkDrawn" and "LinkRelinked" DiagramEvents.
  function showLinkLabel(e) {
    var label = e.subject.findObject("LABEL");
    if (label !== null) label.visible = (e.subject.fromNode.data.figure === "Diamond");
  }

  // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
  myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Link.Orthogonal;
  myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Link.Orthogonal;

  load();  // load an initial diagram from some JSON text

  // initialize the Palette that is on the left side of the page
  myPalette =
    objGo(go.Palette, "myPaletteDiv",  // must name or refer to the DIV HTML element
      {
        "animationManager.duration": 800, // slightly longer than default (600ms) animation
        nodeTemplateMap: myDiagram.nodeTemplateMap,  // share the templates used by myDiagram
        model: new go.GraphLinksModel([  // specify the contents of the Palette
          { category: "Start", text: "Start" },
          { text: "Step" },
          { text: "???", figure: "Diamond" },
          { category: "End", text: "End" },
          { category: "Comment", text: "Comment" }
        ])
      });

}

// Make all ports on a node visible when the mouse is over the node
function showPorts(node, show) {
  var diagram = node.diagram;
  if (!diagram || diagram.isReadOnly || !diagram.allowLink) return;
  node.ports.each(function(port) {
      port.stroke = (show ? "white" : null);
    });
}

function load() {
  myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
}

function paint(index) {
  if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
  var objPaint = go.GraphObject.make;  // for conciseness in defining templates

  myDiagram =
    objPaint(go.Diagram, "paintDiagramDiv"+index,
      {
        // Define the template for Nodes, just some text inside a colored rectangle
        nodeTemplate:
          objPaint(go.Node, "Auto",
            { minSize: new go.Size(60, 20), resizable: true },
            new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
            new go.Binding("position", "pos", go.Point.parse).makeTwoWay(go.Point.stringify),
            // temporarily put selected nodes in Foreground layer
            new go.Binding("layerName", "isSelected", function(s) { return s ? "Foreground" : ""; }).ofObject(),
            objPaint(go.Shape, "Rectangle",
              new go.Binding("fill", "color")),
            objPaint(go.TextBlock,
              { margin: 2,
                click: function(ev, obj) {
                  $('.modal').css({'left': (document.documentElement.clientWidth-800)/2, 'top': (document.documentElement.clientHeight-600)/2})
                  $('.modal').fadeIn();
                  init(index);
                }
               },
              new go.Binding("text", "text"))),
        "undoManager.isEnabled": true
      });

  myDiagram.add(
    objPaint(go.Part,
      { layerName: "Grid", location: new go.Point(0, 0) },
      objPaint(go.TextBlock, "",
        { stroke: "brown" })
    ));

  // Add an instance of the custom tool defined in DragCreatingTool.js.
  // This needs to be inserted before the standard DragSelectingTool,
  // which is normally the third Tool in the ToolManager.mouseMoveTools list.
  // Note that if you do not set the DragCreatingTool.delay, the default value will
  // require a wait after the mouse down event.  Not waiting will allow the DragSelectingTool
  // and the PanningTool to be able to run instead of the DragCreatingTool, depending on the delay.
  myDiagram.toolManager.mouseMoveTools.insertAt(2,
    objPaint(DragCreatingTool,
      {
        isEnabled: true,  // disabled by the checkbox
        delay: 0,  // always canStart(), so PanningTool never gets the chance to run
        box: objPaint(go.Part,
               { layerName: "Tool" },
               objPaint(go.Shape,
                 { name: "SHAPE", fill: null, stroke: "cyan", strokeWidth: 2 })
             ),
        archetypeNodeData: { color: "white" }, // initial properties shared by all nodes
        insertPart: function(bounds) {  // override DragCreatingTool.insertPart
          // use a different color each time
          this.archetypeNodeData.color = 'rgba(255,255,255,.6)';
          this.archetypeNodeData.text = '点击编辑数据结构';
          // call the base method to do normal behavior and return its result
          return DragCreatingTool.prototype.insertPart.call(this, bounds);
        }
      }));
}

//--------------绘制容器图-----------------
var wId = "w";
var index = 0;
var startX = 0, startY = 0, realX = 0, startTime =0, endTime=0;
var flag = false, dragging=false;
var retcLeft = "0px", retcTop = "0px", retcHeight = "0px", retcWidth = "0px", realLeft = "0px";
var pNode = document.getElementById('editArea');
//根据背景图确定宽高
 var img = new Image();
 img.src = './images/banggood.png';
 if(img.complete){
    pNode.style.height=(img.height*pNode.offsetWidth)/img.width +"px";
 }else{
    // 加载完成执行
    img.onload = function(){
      pNode.style.height=(img.height*pNode.offsetWidth)/img.width +"px";
    };
 }
document.onmousedown = function(e){
  flag = true;
  retcLeft = "0px";
  retcTop = "0px";
  retcWidth = "0px";
  retcHeight = "0px";//初始化数据
  startTime = new Date().getTime();
  if(e.target.className.match(/cover/)){
    if(e.target.className.match(/retc/)) {
      // 允许拖动
      dragging = true;
      // 计算坐标差值
      diffX = startX - e.target.offsetLeft;
      diffY = startY - e.target.offsetTop;
      //return false;
    }else {
      try{
       var evt = window.event || e;
       var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
       var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
       startX = evt.clientX + scrollLeft;
       realX = evt.clientX + scrollLeft - (document.documentElement.clientWidth-1500)/2;
       startY = evt.clientY + scrollTop;
       index++;
       var div = document.createElement("div");
       div.id = wId + index;
       div.className = "div";
       div.style.marginLeft = startX + "px";
       div.style.marginTop = startY + "px";
       document.body.appendChild(div);
      }catch(e){

      }
    }
  }

};
document.onmouseup = function(e){
 // 禁止拖动
 dragging = false;
 endTime = new Date().getTime();

 if(endTime - startTime > 500) {
   try{
     document.body.removeChild(_$(wId + index));
     var html = '<div class="retc" style="margin-left:'+retcLeft+';margin-top:'+retcTop+';width:'+retcWidth+'; height:'+retcHeight+'">';
     html += '<div id="paintDiagramDiv'+index+'"style="width:100%;height:100%">';
     html += '<div class="close"><img src="./images/close.png" onClick="removeArea($(this))"/></div></div>'
     //html += '<div id="paintDiagramDiv'+index+'" style="background-color: white; border: solid 1px black; width: 100%;height: 800px"></div>'
     // html += '<ul><li class="section" style="width:600px; height:400px;"><div class="pos">'
     // html += '<div class="tip"><span>区域宽：<div>1200</div></span><span>区域高：<div>350</div></span></div>'
     // html += '<div class="edit"><a href="javascript:;" onClick="showModal($(this))">点击编辑数据结构</a></div>'
     // html += '</div></li></ul>'
     // html += '<div class="modal">'
     // html += '  <div style="width: 100%; display: flex; justify-content: space-between">'
     // html += '    <div id="myPaletteDiv'+index+'" style="width: 100px; margin-right: 2px; background-color: whitesmoke; border: solid 1px black"></div>'
     // html += '    <div id="myDiagramDiv'+index+'" style="flex-grow: 1; height: 580px; border: solid 1px black"></div>'
     // html += '  </div>'
     // html += '  <div class="modalClose" onClick="hideModal($(this))"><img src="./images/close.png"/></div>'
     // html += '</div>'
     html += '</div>'
     $("#editArea").append(html)
     paint(index);
   }catch(e){

   }

 }
 flag = false;
};

function showModal(e){
 $('.modal').fadeIn();
 init();
}
document.onmousemove = function(e){
 if(flag){
  try{
  var evt = window.event || e;
  var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
  var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
  hasMove = Math.abs(startX - evt.clientX - scrollLeft) > 0? true: false;
  retcLeft = (startX - evt.clientX - scrollLeft > 0 ? evt.clientX + scrollLeft : startX) + "px";
  realLeft = (realX - evt.clientX - scrollLeft > 0 ? evt.clientX + scrollLeft : realX) + "px";
  retcTop = (startY - evt.clientY - scrollTop > 0 ? evt.clientY + scrollTop : startY) + "px";
  retcHeight = Math.abs(startY - evt.clientY - scrollTop) + "px";
  retcWidth = Math.abs(startX - evt.clientX - scrollLeft) + "px";
  _$(wId + index).style.marginLeft = retcLeft;
  _$(wId + index).style.marginTop = retcTop;
  _$(wId + index).style.width = retcWidth;
  _$(wId + index).style.height = retcHeight;
  }catch(e){
   //alert(e);
  }
 }
};

function removeArea(e){
 e.parent().parent('.rect').remove();
}

function hideModal(e){
 e.parent().remove();
}

$('.js-close').click(function(){
 $(this).parents('.modal').fadeOut();
})

var _$ = function(id){
 return document.getElementById(id);
}
