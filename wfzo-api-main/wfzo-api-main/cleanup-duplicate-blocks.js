/**
 * Cleanup script to remove duplicate block entries
 * Run this with: node cleanup-duplicate-blocks.js
 * 
 * This converts the old 2-entry blocking system to the new 1-entry system
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wfzo';

async function cleanupDuplicateBlocks() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const connectionsCollection = db.collection('connections');
    
    // Find all connections with blockedUsers
    const connections = await connectionsCollection.find({
      blockedUsers: { $exists: true, $ne: [] }
    }).toArray();
    
    console.log(`📊 Found ${connections.length} connections with blocks`);
    
    let updatedCount = 0;
    
    for (const connection of connections) {
      if (!connection.blockedUsers || connection.blockedUsers.length === 0) {
        continue;
      }
      
      // Group blocks by user pairs (A-B and B-A should be the same)
      const blockMap = new Map();
      
      for (const block of connection.blockedUsers) {
        // Create a sorted key to identify the pair
        const users = [block.blockerId, block.blockedUserId].sort();
        const key = `${users[0]}-${users[1]}`;
        
        if (!blockMap.has(key)) {
          blockMap.set(key, []);
        }
        blockMap.get(key).push(block);
      }
      
      // For each pair, keep only the one where isBlocker === true (or the first one)
      const cleanedBlocks = [];
      
      for (const [key, blocks] of blockMap.entries()) {
        if (blocks.length === 1) {
          // Only one entry - keep it
          cleanedBlocks.push(blocks[0]);
        } else {
          // Multiple entries - keep the one with isBlocker: true, or the first one
          const blockerEntry = blocks.find(b => b.isBlocker === true);
          cleanedBlocks.push(blockerEntry || blocks[0]);
          
          console.log(`  🧹 Cleaned up duplicate for pair ${key} (had ${blocks.length} entries)`);
        }
      }
      
      // Update the connection if we reduced the number of blocks
      if (cleanedBlocks.length < connection.blockedUsers.length) {
        await connectionsCollection.updateOne(
          { _id: connection._id },
          { $set: { blockedUsers: cleanedBlocks } }
        );
        updatedCount++;
        console.log(`  ✅ Updated connection ${connection._id}: ${connection.blockedUsers.length} → ${cleanedBlocks.length} blocks`);
      }
    }
    
    console.log(`\n✨ Cleanup complete! Updated ${updatedCount} connections.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupDuplicateBlocks();
