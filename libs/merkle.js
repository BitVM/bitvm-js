import {blake3} from '../libs/blake3.js'
import {toHex, concat, padRight} from '../libs/bytes.js'

const BLAKE3_ZERO_HASHES = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],   
    [53, 43, 210, 102, 218, 229, 60, 110, 106, 41, 36, 64, 17, 207, 160, 41, 129, 61, 10, 184],
    [14, 197, 186, 149, 175, 113, 2, 91, 20, 109, 234, 197, 62, 150, 255, 154, 220, 3, 51, 116],
    [123, 165, 20, 225, 166, 31, 181, 18, 73, 109, 253, 173, 14, 47, 173, 31, 12, 218, 0, 39],
    [82, 61, 104, 220, 208, 183, 60, 48, 79, 61, 175, 177, 252, 170, 52, 238, 255, 117, 213, 107],
    [72, 140, 160, 179, 218, 17, 50, 97, 84, 100, 196, 127, 34, 102, 179, 127, 151, 106, 113, 167],
    [166, 67, 214, 177, 239, 83, 5, 11, 103, 155, 73, 165, 251, 43, 111, 52, 205, 65, 150, 35],
    [247, 47, 45, 135, 11, 235, 169, 168, 53, 34, 245, 161, 163, 104, 100, 50, 162, 193, 242, 47],
    [9, 120, 198, 46, 234, 15, 50, 191, 206, 166, 225, 163, 96, 231, 255, 169, 117, 175, 33, 217],
    [44, 30, 169, 50, 129, 209, 16, 51, 106, 210, 12, 20, 192, 197, 68, 26, 139, 68, 98, 119],
    [50, 194, 3, 16, 119, 72, 217, 167, 108, 77, 176, 182, 143, 140, 60, 50, 46, 196, 190, 54],
    [214, 106, 11, 1, 217, 47, 78, 191, 102, 138, 119, 149, 154, 164, 16, 155, 231, 90, 241, 8],
    [50, 212, 236, 31, 118, 230, 95, 150, 96, 172, 59, 210, 165, 212, 73, 94, 179, 10, 34, 52],
    [120, 69, 24, 212, 103, 40, 242, 93, 170, 42, 205, 198, 148, 120, 77, 105, 85, 249, 15, 167],
    [140, 152, 146, 107, 41, 35, 5, 248, 245, 222, 142, 113, 11, 60, 133, 168, 66, 247, 69, 250],
    [146, 98, 31, 219, 248, 208, 102, 175, 203, 72, 238, 116, 119, 111, 143, 229, 133, 113, 199, 104],
    [170, 8, 63, 159, 114, 151, 170, 208, 43, 60, 49, 200, 152, 11, 181, 49, 60, 14, 28, 246],
    [68, 42, 136, 103, 53, 0, 62, 203, 161, 44, 174, 133, 134, 147, 200, 8, 185, 235, 161, 25],
    [18, 249, 88, 207, 105, 42, 160, 144, 171, 155, 28, 237, 176, 96, 24, 249, 58, 40, 200, 198],
    [93, 130, 192, 51, 239, 160, 237, 131, 205, 97, 200, 251, 166, 70, 147, 232, 31, 241, 46, 54],
    [139, 207, 173, 210, 203, 100, 201, 243, 150, 170, 220, 144, 42, 31, 5, 145, 199, 252, 212, 243],
    [172, 227, 69, 150, 192, 201, 186, 15, 87, 73, 60, 37, 226, 154, 75, 191, 238, 247, 164, 155],
    [120, 226, 111, 210, 33, 225, 86, 119, 242, 234, 36, 161, 159, 121, 135, 200, 198, 113, 195, 214],
    [239, 218, 162, 17, 119, 46, 225, 125, 1, 1, 0, 47, 69, 103, 62, 214, 69, 66, 154, 250],
    [159, 213, 142, 48, 175, 36, 4, 129, 231, 60, 198, 204, 187, 234, 213, 33, 217, 168, 8, 14],
    [45, 43, 205, 130, 123, 113, 98, 70, 214, 226, 160, 65, 184, 54, 222, 181, 173, 2, 252, 180],
    [140, 36, 59, 194, 132, 87, 76, 131, 242, 19, 240, 59, 21, 163, 38, 136, 105, 2, 98, 165],
    [184, 133, 175, 205, 215, 15, 59, 58, 254, 71, 41, 81, 79, 210, 201, 76, 154, 110, 80, 232],
    [114, 166, 60, 77, 185, 171, 97, 67, 86, 59, 197, 174, 101, 45, 90, 130, 5, 28, 5, 210],
    [34, 120, 233, 212, 114, 16, 11, 103, 53, 157, 95, 78, 236, 38, 101, 236, 188, 121, 224, 218],
    [26, 49, 251, 232, 222, 186, 112, 212, 126, 49, 226, 245, 139, 60, 127, 223, 218, 83, 191, 136],
    [72, 221, 68, 125, 140, 116, 102, 238, 215, 196, 221, 46, 203, 102, 234, 201, 246, 141, 65, 60],
].map(arr => new Uint8Array(arr).buffer)


const hash = input => blake3(input).slice(0, 20).buffer


export const buildTree = (leaves) => {
    if (!Array.isArray(leaves))
        throw TypeError('leaves must be Array')
    // We need at least one leaf
    if (leaves.length === 0) 
        throw Error('leaves is empty')

    // Pad each leaf with zeros
    leaves = leaves.map(item => {
        if (Array.isArray(item))  
            throw TypeError('item must be ArrayBuffer')
        return padRight(item, 20)
    })

    // Hash from leaves to root
    let layer = 0
    while (leaves.length > 1) {
        if (leaves.length & 1)
            // Use precomputed zero hash
            leaves[leaves.length] = BLAKE3_ZERO_HASHES[layer]
        
        layer++
        const tmp = []
        // Compute next layer
        for (let i = 0; i < leaves.length; i += 2) {
            const preimage = concat(leaves[i], leaves[i+1])
            tmp[tmp.length] = hash(preimage)
        }
        leaves = tmp
    }
    // Extend to 32 layers
    while (layer < 32) {
        leaves[1] = BLAKE3_ZERO_HASHES[layer]
        const preimage = concat(leaves[0], leaves[1])
        leaves[0] = hash(preimage)
        layer++
    }
    // Return root
    return leaves[0]
}

export const buildPath = (leaves, index) => {
    if (!Array.isArray(leaves))  
        throw TypeError('leaves must be Array')
    // We need at least one leaf
    if (leaves.length === 0) 
        throw Error('leaves is empty')
    if (index === undefined)  
        throw TypeError('index must be defined')

    // Pad each leaf with zeros
    leaves = leaves.map(item => {
        if (Array.isArray(item))  
            throw TypeError('item must be ArrayBuffer')
        return padRight(item, 20)
    })

    let path = []
    let layer = 0
    // Hash from leaves to root
    while (leaves.length > 1) {
        if (leaves.length & 1) {
            // Use precomputed zero hash
            leaves[leaves.length] = BLAKE3_ZERO_HASHES[layer]
        }
        path[path.length] = leaves[index ^ 1]
        layer++
        const tmp = []
        // Compute next layer
        for (let i = 0; i < leaves.length; i += 2) {
            const preimage = concat(leaves[i], leaves[i+1])
            tmp[tmp.length] = hash(preimage)
        }
        leaves = tmp
        index = index >>> 1
    }
    // Extend to 32 layers
    while (layer < 32) {
        path[path.length] = BLAKE3_ZERO_HASHES[layer]
        layer++
    }
    // Return path
    return path
}

export const verifyPath = (path, leaf, index) => {
    if (!Array.isArray(path)) 
        throw TypeError('path must be Array')
    if (Array.isArray(leaf)) 
        throw TypeError('leaf must be ArrayBuffer')
    if (index === undefined) 
        throw TypeError('index must be defined')

    // Pad the leaf with zeros
    leaf = padRight(leaf, 20)
    // Hash the path from leaf to root
    return path.reduce((node, sibling) => {
        if (Array.isArray(sibling))
            throw TypeError('sibling must be ArrayBuffer')
        let preimage = (index & 1) == 0 ? concat(node, sibling) : concat(sibling, node)
        index = index >>> 1
        return hash(preimage)
    }, leaf)
}