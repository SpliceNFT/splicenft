/**
 * draw() makes a call to sampleSpliceAlgo, simulating how a Splice algorithm is called
 */
function draw() {
  //temporarily setting up a canvas half the final banner size as it's easier to see and work with
  thisCanvas = createCanvas(1500/2, 500/2);
  let dim = new Dimension(width,height);

  //copy and paste sample palette here
  let colors = [color(238, 235, 154,255), color(234, 89, 138), color(182, 127, 82, 255) ];
  
  //maybe try reordering that array so can easily access darkest and lightest colors
  orderedColorArray =[];
  orderedColorArray = reOrderColorsDarkestToLightest(colors);
  
  sampleSpliceAlgo(orderedColorArray, dim);
  noLoop();
}


/**
 * sampleSpliceAlgo() is the style algorithm itself
 */
function sampleSpliceAlgo(colors, dim) {
  //cast your spell here!
  background(color(255,0,0));
  fill(color(colors[0]));
  stroke(color(colors[1]));
  strokeWeight(15);
  rect(50,50,dim.w-100,dim.h-100);
}


/**
 * Dimension() simulates the dim variable  Splice sends to the sampleSpliceAlgo
 */
function Dimension(w, h) {
  this.w = w;
  this.h = h;
}


/**
* reOrderColorsDarkestToLightest() takes an array of colors and sends back an array ordered darkest to lightest. (Surely this function can be written better, but in case it's handy for you, including it here.)
*/
function reOrderColorsDarkestToLightest(colors){
  let orderedColors = [];
  let rgbSumOfColorsArray = [];
  
  //creating an array of color sums
  for(let i = 0; i<colors.length; i++){
    rgbSumOfColorsArray.push(getRGBSum(colors[i]));
  }
  
  //cycle through colors, and get darkest
  while(orderedColors.length <colors.length){
    //initialize with the first color in the rgbSumOfColorsArray
    let sum_of_darkest_remaining_color;
    let index_of_darkest_remaining_color;
    
    //get the first color in the array
    for(let i = 0; i<rgbSumOfColorsArray.length; i++){
      if(rgbSumOfColorsArray[i]!=-1){
        sum_of_darkest_remaining_color = rgbSumOfColorsArray[i];
         index_of_darkest_remaining_color = i;
        break;
      }
    }
    
    for(let i = 0; i<rgbSumOfColorsArray.length; i++){
      index_sum_of_color = rgbSumOfColorsArray[i];
      if((sum_of_darkest_remaining_color>index_sum_of_color)&&(index_sum_of_color!=-1)){
        sum_of_darkest_remaining_color=index_sum_of_color;
        index_of_darkest_remaining_color = i;
      }
    }
    
    //found the darkest remaining color, and adding it to the new ordered array
    orderedColors.push(colors[index_of_darkest_remaining_color]);
    
   //set the array index to a dummy number
    rgbSumOfColorsArray[index_of_darkest_remaining_color] = -1;
  }
  return(orderedColors);
}


/**
* getRGBSum(this_color) adds up RGB values for an RGB color
*/
function getRGBSum(this_color){
  return(red(this_color)+green(this_color)+blue(this_color))
}


/**
 * getLikeColor() calculates a color that's more or less saturated than the input color. 
 * This function may be helpful if an input NFT is only 2 colors, 
 * and you'd like to add a few in between shades to the palette array.
 */
function getLikeColor(a_color){
  let its_red = red(a_color)
  let its_green = green(a_color)
  let its_blue = blue(a_color)
  let total_colors =its_red+its_green+its_blue;
  if(total_colors==0){
    //if it's black, need to set so that total isn't zero
    its_red=10; its_green = 10; its_blue = 10;
    total_colors =its_red+its_green+its_blue;
  }
  //if it's a light color, get a like color that's darker
  let new_total_colors = int(random(0,(255*3)));
  //set same proportions of each color in the old color for the new color
  let new_color = color(  
    ((its_red*new_total_colors)/total_colors),
    ((its_green*new_total_colors)/total_colors),
    ((its_blue*new_total_colors)/total_colors)
  );
  return new_color;
}
