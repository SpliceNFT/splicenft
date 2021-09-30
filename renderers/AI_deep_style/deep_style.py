
import matplotlib.pyplot as plt
import tensorflow as tf
import numpy as np
import PIL.Image

import vgg16
vgg16.maybe_download()

def load_image(filename, crop_resize):
    image = PIL.Image.open(filename)

    if (crop_resize == True):
        #image = center_crop(image, 500, 3)

        image = image.resize((1500, 500))

    return np.float32(image)

def center_crop(img, width, ratio):
  width, height = img.shape[1], img.shape[0]
  new_height = width/ratio
  mid_y = int(height/2)
  ch2 = int(new_height/2)
  crop_img   = img[mid_y-ch2:mid_y+ch2,0:width]
  return crop_img

def resize_img(img, width=500, height=1500):

  resized_image = img.resize((1500, 500))

  return resized_image

def save_image(image, filename):
  
    image = np.clip(image, 0.0, 255.0)
    
    image = image.astype(np.uint8)
  
    with open(filename, 'wb') as file:
        PIL.Image.fromarray(image).save(file, 'jpeg')

def plot_image_big(image):
  
    image = np.clip(image, 0.0, 255.0)
    image = image.astype(np.uint8)
    img = PIL.Image.fromarray(image)
    img.show()

def plot_images(content_image, style_image, mixed_image):

    fig, axes = plt.subplots(1, 3, figsize=(10, 10))

    fig.subplots_adjust(hspace=0.1, wspace=0.1)

    smooth = True
    
    if smooth:
        interpolation = 'sinc'
    else:
        interpolation = 'nearest'

    ax = axes.flat[0]
    ax.imshow(content_image / 255.0, interpolation=interpolation)
    ax.set_xlabel("Content")

    ax = axes.flat[1]
    ax.imshow(mixed_image / 255.0, interpolation=interpolation)
    ax.set_xlabel("Mixed")

    ax = axes.flat[2]
    ax.imshow(style_image / 255.0, interpolation=interpolation)
    ax.set_xlabel("Style")

    for ax in axes.flat:
        ax.set_xticks([])
        ax.set_yticks([])
    
    plt.show()

def mean_squared_error(a, b):
    return tf.reduce_mean(tf.square(a - b))

def create_content_loss(session, model, content_image, layer_ids):

    feed_dict = model.create_feed_dict(image=content_image)

    layers = model.get_layer_tensors(layer_ids)

    values = session.run(layers, feed_dict=feed_dict)

    with model.graph.as_default():

        layer_losses = []
    
        for value, layer in zip(values, layers):
        
            value_const = tf.constant(value)

            loss = mean_squared_error(layer, value_const)

            layer_losses.append(loss)

        total_loss = tf.reduce_mean(layer_losses)
        
    return total_loss

def gram_matrix(tensor):

    shape = tensor.get_shape()

    num_channels = int(shape[3])

    matrix = tf.reshape(tensor, shape=[-1, num_channels])
    
    gram = tf.matmul(tf.transpose(matrix), matrix)

    return gram

def create_style_loss(session, model, style_image, layer_ids):
    
    feed_dict = model.create_feed_dict(image=style_image)

    layers = model.get_layer_tensors(layer_ids)

    with model.graph.as_default():

        gram_layers = [gram_matrix(layer) for layer in layers]

        values = session.run(gram_layers, feed_dict=feed_dict)

        layer_losses = []
    
        for value, gram_layer in zip(values, gram_layers):

            value_const = tf.constant(value)
           
            loss = mean_squared_error(gram_layer, value_const)

            layer_losses.append(loss)

        total_loss = tf.reduce_mean(layer_losses)
        
    return total_loss

def create_denoise_loss(model):
    loss = tf.reduce_sum(tf.abs(model.input[:,1:,:,:] - model.input[:,:-1,:,:])) + \
           tf.reduce_sum(tf.abs(model.input[:,:,1:,:] - model.input[:,:,:-1,:]))

    return loss

def style_transfer(content_image, style_image,
                   content_layer_ids, style_layer_ids,
                   weight_content=1.5, weight_style=10.0,
                   weight_denoise=0.3,
                   num_iterations=120, step_size=10.0):
  
    model = vgg16.VGG16()

    session = tf.compat.v1.InteractiveSession(graph=model.graph)

    print("Content layers:")
    print(model.get_layer_names(content_layer_ids))
    print()

    print("Style layers:")
    print(model.get_layer_names(style_layer_ids))
    print()

    loss_content = create_content_loss(session=session,
                                       model=model,
                                       content_image=content_image,
                                       layer_ids=content_layer_ids)

    loss_style = create_style_loss(session=session,
                                   model=model,
                                   style_image=style_image,
                                   layer_ids=style_layer_ids)    

    loss_denoise = create_denoise_loss(model)

    
    adj_content = tf.Variable(1e-10, name='adj_content')
    adj_style = tf.Variable(1e-10, name='adj_style')
    adj_denoise = tf.Variable(1e-10, name='adj_denoise')

    session.run([adj_content.initializer,
                 adj_style.initializer,
                 adj_denoise.initializer])

    update_adj_content = adj_content.assign(1.0 / (loss_content + 1e-10))
    update_adj_style = adj_style.assign(1.0 / (loss_style + 1e-10))
    update_adj_denoise = adj_denoise.assign(1.0 / (loss_denoise + 1e-10))

    loss_combined = weight_content * adj_content * loss_content + \
                    weight_style * adj_style * loss_style + \
                    weight_denoise * adj_denoise * loss_denoise

    gradient = tf.gradients(loss_combined, model.input)

    run_list = [gradient, update_adj_content, update_adj_style, \
                update_adj_denoise]

    mixed_image = np.random.rand(*content_image.shape) + 128

    for i in range(num_iterations):
     
        feed_dict = model.create_feed_dict(image=mixed_image)

        grad, adj_content_val, adj_style_val, adj_denoise_val \
        = session.run(run_list, feed_dict=feed_dict)

        grad = np.squeeze(grad)

        step_size_scaled = step_size / (np.std(grad) + 1e-8)

        mixed_image -= grad * step_size_scaled

        mixed_image = np.clip(mixed_image, 0.0, 255.0)

    plot_image_big(mixed_image)

    session.close()
    
    return mixed_image

content_filename = 'images/cat.png'
content_image = load_image(content_filename, True)
#content_image = center_crop(content_image, 500, 3)
#content_image = resize_img(content_image, 500, 1500)
content_layer_ids = [0, 1, 2] # 0 to 4 (4 seems to work well)

style_filename = 'images/style.jpeg'
style_image = load_image(style_filename, False)
style_layer_ids = [7, 8, 9, 10, 11, 12]  # 1 to 13 or array style_layer_ids = [1, 2, 3, 4]

img = style_transfer(content_image=content_image,
                     style_image=style_image,
                     content_layer_ids=content_layer_ids,
                     style_layer_ids=style_layer_ids,
                     weight_content=2,
                     weight_style=10.0,
                     weight_denoise=0.3,
                     num_iterations=200,
                     step_size=10.0)

plot_image_big(img)

save_image(img, "output.png")



